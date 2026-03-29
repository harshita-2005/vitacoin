const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const router = express.Router();

/** Base Vitacoin price for first redemption of each catalog coupon (id 1–6). Keep in sync with frontend AVAILABLE_COUPONS. */
const COUPON_BASE_COSTS = {
  1: 500,
  2: 400,
  3: 300,
  4: 600,
  5: 550,
  6: 450
};

/** Added to base cost for each prior redemption of the same coupon id. */
const COUPON_PRICE_STEP = 50;

function normalizeCouponCounts(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) continue;
    out[String(k)] = Math.floor(n);
  }
  return out;
}

function getPriorRedemptions(user, couponId) {
  const c = user.couponRedemptionCounts;
  if (!c || typeof c !== 'object') return 0;
  const n = Number(c[String(couponId)]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function expectedCouponCost(couponId, priorRedemptions) {
  const base = COUPON_BASE_COSTS[couponId];
  if (base == null) return null;
  return base + priorRedemptions * COUPON_PRICE_STEP;
}

/**
 * Demo top-up: off in production unless ALLOW_DEMO_WALLET_TOPUP=true.
 * Local `nodemon` often has no NODE_ENV — allow then too (not production).
 */
function isDemoWalletTopupAllowed() {
  if (process.env.ALLOW_DEMO_WALLET_TOPUP === 'true') return true;
  if (process.env.ALLOW_DEMO_WALLET_TOPUP === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

// @desc    Get user wallet balance
// @route   GET /api/wallet/balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'coinBalance totalEarned couponRedemptionCounts'
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.coinBalance,
      totalEarned: user.totalEarned,
      couponRedemptionCounts: normalizeCouponCounts(user.couponRedemptionCounts),
      couponPriceStep: COUPON_PRICE_STEP
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({ 
      error: 'Server error fetching wallet balance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Spend coins from wallet
// @route   POST /api/wallet/spend
// @access  Private
router.post('/spend', protect, async (req, res) => {
  try {
    const { amount, description, category = 'coupon_redemption', couponId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let spendAmount = Number(amount);

    if (category === 'coupon_redemption') {
      const cid = Number(couponId);
      if (!Number.isInteger(cid) || !COUPON_BASE_COSTS[cid]) {
        return res.status(400).json({ error: 'Valid couponId (1–6) is required for coupon redemption' });
      }
      const prior = getPriorRedemptions(user, cid);
      const expected = expectedCouponCost(cid, prior);
      if (spendAmount !== expected) {
        return res.status(400).json({
          error: 'Coupon price has changed — refresh the page',
          expectedAmount: expected,
          couponId: cid
        });
      }
    }

    if (user.coinBalance < spendAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update user balance
      user.coinBalance -= spendAmount;
      if (category === 'coupon_redemption') {
        const cid = Number(couponId);
        if (!user.couponRedemptionCounts || typeof user.couponRedemptionCounts !== 'object') {
          user.couponRedemptionCounts = {};
        }
        const key = String(cid);
        user.couponRedemptionCounts[key] = getPriorRedemptions(user, cid) + 1;
        user.markModified('couponRedemptionCounts');
      }
      await user.save({ session });

      // Create transaction record
      const txPayload = {
        user: req.user._id,
        type: 'deduct',
        amount: -spendAmount, // Make amount negative for deductions
        description: description,
        category: category,
        balanceBefore: user.coinBalance + spendAmount,
        balanceAfter: user.coinBalance
      };
      if (category === 'coupon_redemption' && couponId != null) {
        txPayload.metadata = { couponId: Number(couponId) };
      }
      const transaction = new Transaction(txPayload);

      await transaction.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        newBalance: user.coinBalance,
        transaction: transaction,
        couponRedemptionCounts: normalizeCouponCounts(user.couponRedemptionCounts)
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Wallet spend error:', error);
    res.status(500).json({ 
      error: 'Server error processing wallet spend',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Add demo coins (development or ALLOW_DEMO_WALLET_TOPUP=true only)
// @route   POST /api/wallet/demo-topup
// @access  Private
router.post('/demo-topup', protect, async (req, res) => {
  if (!isDemoWalletTopupAllowed()) {
    return res.status(404).json({ error: 'Not found' });
  }

  const raw = req.body?.amount;
  const amount = Math.min(Math.max(Number(raw) || 600, 1), 50000);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceBefore = user.coinBalance;
    user.coinBalance += amount;
    user.totalEarned = (user.totalEarned || 0) + amount;
    await user.save({ session });

    const transaction = new Transaction({
      user: req.user._id,
      type: 'earn',
      amount,
      description: `Demo wallet top-up (+${amount} coins)`,
      category: 'system_bonus',
      balanceBefore,
      balanceAfter: user.coinBalance
    });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      newBalance: user.coinBalance,
      added: amount,
      transaction
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Demo top-up error:', error);
    res.status(500).json({
      error: 'Server error during demo top-up',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
