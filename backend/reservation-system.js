const { Pool } = require('pg');

class StockReservationSystem {
  constructor(pool) {
    this.pool = pool;
  }

  // Reserve stock for a work order or manufacturing order
  async reserveStock(productId, qty, unit, refType, refId, userId, role) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check available stock
      const stockCheck = await client.query(`
        SELECT available_quantity, reserved_quantity 
        FROM stock_balances 
        WHERE product_id = $1 AND location_id = 1
      `, [productId]);
      
      if (stockCheck.rows.length === 0) {
        throw new Error('Product not found in inventory');
      }
      
      const { available_quantity, reserved_quantity } = stockCheck.rows[0];
      const totalAvailable = parseFloat(available_quantity) - parseFloat(reserved_quantity);
      
      if (totalAvailable < qty) {
        throw new Error(`Insufficient stock. Available: ${totalAvailable}, Required: ${qty}`);
      }
      
      // Create reservation
      const reservationResult = await client.query(`
        INSERT INTO stock_reservations (product_id, qty, unit, ref_type, ref_id, reserved_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
        RETURNING *
      `, [productId, qty, unit, refType, refId, userId]);
      
      // Update stock balances
      await client.query(`
        UPDATE stock_balances 
        SET reserved_quantity = reserved_quantity + $1 
        WHERE product_id = $2 AND location_id = 1
      `, [qty, productId]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        reservation_id: reservationResult.rows[0].reservation_id,
        message: 'Stock reserved successfully'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Commit reservation (when work order is completed)
  async commitReservation(reservationId, finishedProductId, finishedQty, userId, role) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get reservation details
      const reservation = await client.query(`
        SELECT * FROM stock_reservations 
        WHERE reservation_id = $1 AND status = 'ACTIVE'
      `, [reservationId]);
      
      if (reservation.rows.length === 0) {
        throw new Error('Reservation not found or already processed');
      }
      
      const res = reservation.rows[0];
      
      // Update reservation status
      await client.query(`
        UPDATE stock_reservations 
        SET status = 'COMMITTED', updated_at = now() 
        WHERE reservation_id = $1
      `, [reservationId]);
      
      // Reduce reserved quantity
      await client.query(`
        UPDATE stock_balances 
        SET reserved_quantity = reserved_quantity - $1,
            available_quantity = available_quantity - $1
        WHERE product_id = $2 AND location_id = 1
      `, [res.qty, res.product_id]);
      
      // Add finished product to stock
      if (finishedProductId && finishedQty > 0) {
        await client.query(`
          INSERT INTO stock_ledger (product_id, txn_type, quantity, balance_after, reference_type, reference_id, user_id, notes)
          VALUES ($1, 'IN', $2, 
            COALESCE((SELECT current_stock FROM products WHERE product_id = $1), 0) + $2, 
            'MO', $3, $4, 'Production completion')
        `, [finishedProductId, finishedQty, res.ref_id, userId]);
        
        await client.query(`
          UPDATE products 
          SET current_stock = current_stock + $1 
          WHERE product_id = $2
        `, [finishedQty, finishedProductId]);
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        message: 'Reservation committed successfully'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Release reservation (when work order is cancelled)
  async releaseReservation(reservationId, reason, userId, role) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get reservation details
      const reservation = await client.query(`
        SELECT * FROM stock_reservations 
        WHERE reservation_id = $1 AND status = 'ACTIVE'
      `, [reservationId]);
      
      if (reservation.rows.length === 0) {
        throw new Error('Reservation not found or already processed');
      }
      
      const res = reservation.rows[0];
      
      // Update reservation status
      await client.query(`
        UPDATE stock_reservations 
        SET status = 'RELEASED', updated_at = now() 
        WHERE reservation_id = $1
      `, [reservationId]);
      
      // Reduce reserved quantity
      await client.query(`
        UPDATE stock_balances 
        SET reserved_quantity = reserved_quantity - $1
        WHERE product_id = $2 AND location_id = 1
      `, [res.qty, res.product_id]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        message: 'Reservation released successfully'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Adjust stock (manual adjustments)
  async adjustStock(productId, qty, unit, reason, userId, role) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current stock
      const currentStock = await client.query(`
        SELECT available_quantity FROM stock_balances 
        WHERE product_id = $1 AND location_id = 1
      `, [productId]);
      
      const current = currentStock.rows[0]?.available_quantity || 0;
      const newBalance = parseFloat(current) + parseFloat(qty);
      
      if (newBalance < 0) {
        throw new Error('Insufficient stock for adjustment');
      }
      
      // Insert ledger entry
      await client.query(`
        INSERT INTO stock_ledger (product_id, txn_type, quantity, balance_after, reference_type, user_id, notes)
        VALUES ($1, $2, $3, $4, 'MANUAL', $5, $6)
      `, [productId, qty > 0 ? 'IN' : 'OUT', Math.abs(qty), newBalance, userId, reason]);
      
      // Update stock balance
      await client.query(`
        UPDATE stock_balances 
        SET available_quantity = $1, last_updated = now()
        WHERE product_id = $2 AND location_id = 1
      `, [newBalance, productId]);
      
      // Update products table
      await client.query(`
        UPDATE products 
        SET current_stock = $1 
        WHERE product_id = $2
      `, [newBalance, productId]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        new_balance: newBalance,
        message: 'Stock adjusted successfully'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reconcile inventory (admin function)
  async reconcileInventory() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get all products with stock
      const products = await client.query(`
        SELECT product_id, 
               SUM(CASE WHEN txn_type = 'IN' THEN quantity ELSE -quantity END) as calculated_stock
        FROM stock_ledger 
        GROUP BY product_id
      `);
      
      let reconciled = 0;
      for (const product of products.rows) {
        // Update stock balances
        await client.query(`
          UPDATE stock_balances 
          SET available_quantity = $1, last_updated = now()
          WHERE product_id = $2 AND location_id = 1
        `, [product.calculated_stock, product.product_id]);
        
        // Update products table
        await client.query(`
          UPDATE products 
          SET current_stock = $1 
          WHERE product_id = $2
        `, [product.calculated_stock, product.product_id]);
        
        reconciled++;
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        reconciled_products: reconciled,
        message: 'Inventory reconciled successfully'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = StockReservationSystem;
