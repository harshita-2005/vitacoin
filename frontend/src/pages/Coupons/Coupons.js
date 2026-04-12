import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiShoppingBag, FiCheckCircle, FiAlertCircle, FiCopy, FiDollarSign } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CoinDisplay from '../../components/UI/CoinDisplay';

// Hardcoded coupons data (module-level for stable reference in useEffect)
const AVAILABLE_COUPONS = [
  {
    id: 1,
    name: 'Amazon',
    logo: '🛒',
    cost: 500,
    value: '₹50',
    description: 'Get ₹50 off on Amazon',
    couponCode: 'AMZ50OFF',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 2,
    name: 'Flipkart',
    logo: '📦',
    cost: 400,
    value: '₹40',
    description: 'Get ₹40 off on Flipkart',
    couponCode: 'FLIP40',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 3,
    name: 'Zepto',
    logo: '🚚',
    cost: 300,
    value: '₹30',
    description: 'Get ₹30 off on Zepto',
    couponCode: 'ZEP30',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 4,
    name: 'Swiggy',
    logo: '🍕',
    cost: 600,
    value: '₹60',
    description: 'Get ₹60 off on Swiggy',
    couponCode: 'SWIG60',
    color: 'from-orange-400 to-orange-500'
  },
  {
    id: 5,
    name: 'Zomato',
    logo: '🍽️',
    cost: 550,
    value: '₹55',
    description: 'Get ₹55 off on Zomato',
    couponCode: 'ZOM55',
    color: 'from-red-500 to-red-600'
  },
  {
    id: 6,
    name: 'Myntra',
    logo: '👗',
    cost: 450,
    value: '₹45',
    description: 'Get ₹45 off on Myntra',
    couponCode: 'MYN45',
    color: 'from-pink-500 to-pink-600'
  }
];

/** Parse "₹50" → 50 for scaling reward with coin cost */
function parseBaseRupees(valueStr) {
  const m = String(valueStr).match(/₹\s*(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** Must match backend COUPON_PRICE_STEP in routes/wallet.js */
const COUPON_PRICE_STEP = 50;

const Coupons = () => {
  const [redemptionCounts, setRedemptionCounts] = useState({});
  const [userBalance, setUserBalance] = useState(0);
  const [redeemingCouponId, setRedeemingCouponId] = useState(null);
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [demoTopupLoading, setDemoTopupLoading] = useState(false);
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  /** Show “add demo coins” only in dev, or when REACT_APP_ENABLE_COUPON_DEMO=true (e.g. staging demo). */
  const showCouponDemoTools =
    process.env.NODE_ENV === 'development' ||
    process.env.REACT_APP_ENABLE_COUPON_DEMO === 'true';

  const fetchUserBalance = useCallback(async () => {
    if (!user) {
      setUserBalance(0);
      setRedemptionCounts({});
      setError(null);
      return;
    }
    try {
      const response = await api.get('/api/wallet/balance');
      const bal = response.data?.balance;
      setUserBalance(typeof bal === 'number' ? bal : 0);
      if (response.data?.couponRedemptionCounts && typeof response.data.couponRedemptionCounts === 'object') {
        setRedemptionCounts(response.data.couponRedemptionCounts);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching user balance:', err);
      const msg = err.response?.data?.error || err.message;
      // Auth runs /api/auth/verify first — use profile balance if wallet call fails (race or 401)
      if (user != null && typeof user.coinBalance === 'number') {
        setUserBalance(user.coinBalance);
        if (user.couponRedemptionCounts && typeof user.couponRedemptionCounts === 'object') {
          setRedemptionCounts(user.couponRedemptionCounts);
        }
        setError(null);
      } else {
        setError(msg || 'Failed to fetch wallet balance');
      }
    }
  }, [user]);

  const coupons = useMemo(() => {
    return AVAILABLE_COUPONS.map((c) => {
      const n = Number(redemptionCounts[String(c.id)] ?? redemptionCounts[c.id] ?? 0) || 0;
      const prior = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
      const baseRupees = parseBaseRupees(c.value);
      const currentCost = c.cost + prior * COUPON_PRICE_STEP;
      // Same coins-per-rupee as first redemption: reward grows with cost
      const scaledRupees =
        baseRupees > 0 && c.cost > 0
          ? Math.max(1, Math.round((baseRupees * currentCost) / c.cost))
          : baseRupees;
      const value = `₹${scaledRupees}`;
      const description = `Get ${value} off on ${c.name}`;
      return {
        ...c,
        baseCost: c.cost,
        cost: currentCost,
        value,
        description
      };
    });
  }, [redemptionCounts]);

  useEffect(() => {
    if (authLoading) return;
    if (user != null && typeof user.coinBalance === 'number') {
      setUserBalance(user.coinBalance);
    }
    if (user?.couponRedemptionCounts && typeof user.couponRedemptionCounts === 'object') {
      setRedemptionCounts((prev) => ({ ...prev, ...user.couponRedemptionCounts }));
    }
    fetchUserBalance();
  }, [authLoading, user, fetchUserBalance]);

  const handleDemoTopup = useCallback(async () => {
    setDemoTopupLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/wallet/demo-topup', { amount: 600 });
      const next = response.data?.newBalance;
      if (typeof next === 'number') {
        setUserBalance(next);
        if (updateUser && user) {
          updateUser({ ...user, coinBalance: next });
        }
      }
    } catch (err) {
      console.error('Demo top-up failed:', err);
      setError(
        err.response?.data?.error ||
          'Demo top-up failed. Run backend with NODE_ENV=development or set ALLOW_DEMO_WALLET_TOPUP=true.'
      );
    } finally {
      setDemoTopupLoading(false);
    }
  }, [updateUser, user]);

  const handleRedeem = async (coupon) => {
    if (userBalance < coupon.cost) {
      setError('Insufficient balance to redeem this coupon');
      return;
    }

    setRedeemingCouponId(coupon.id);
    setError(null);

    try {
      const response = await api.post('/api/wallet/spend', {
        amount: coupon.cost,
        description: `Redeemed ${coupon.name} coupon worth ${coupon.value}`,
        category: 'coupon_redemption',
        couponId: coupon.id
      });

      // Update local state
      setUserBalance(response.data.newBalance);
      if (response.data.couponRedemptionCounts) {
        setRedemptionCounts(response.data.couponRedemptionCounts);
      }
      setRedeemedCoupon({
        ...coupon,
        paidCoins: coupon.cost,
        transactionId: response.data.transaction._id,
        redeemedAt: new Date().toISOString()
      });
      
      // Update user context
      if (updateUser) {
        updateUser({
          ...user,
          coinBalance: response.data.newBalance,
          couponRedemptionCounts: response.data.couponRedemptionCounts || user?.couponRedemptionCounts
        });
      }

    } catch (error) {
      console.error('Error redeeming coupon:', error);
      if (error.response?.status === 400 && error.response?.data?.expectedAmount != null) {
        fetchUserBalance();
      }
      setError(error.response?.data?.error || 'Failed to redeem coupon');
    } finally {
      setRedeemingCouponId(null);
    }
  };

  const closeSuccessModal = () => {
    setRedeemedCoupon(null);
    setCopySuccess(false);
    // Optionally refresh user data to ensure everything is in sync
    fetchUserBalance();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-warm-text mb-4">
          <FiGift className="inline-block w-10 h-10 mr-3 text-primary-600" />
          Spend Your Vitacoins
        </h1>
        <div className="text-lg text-warm-textSecondary mb-6">
          Redeem your hard-earned Vitacoins for exciting coupon codes
        </div>
        
                 {/* Balance Display */}
         <div className="inline-flex items-center gap-3 bg-warm-container border border-warm-border text-warm-text px-6 py-3 rounded-full shadow-lg">
           <span className="text-lg font-semibold">Your Balance:</span>
           <span className="inline-flex items-center gap-1.5 text-lg font-semibold">
             <FiDollarSign className="w-6 h-6 text-black-500 shrink-0" aria-hidden />
             <span className="text-black font-semibold">{userBalance.toLocaleString()}</span>
             <span className="text-black">coins</span>
           </span>
         </div>

         {/* Available Coupons Count */}
         <div className="mt-2 text-sm text-warm-textSecondary">
           {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} available
         </div>

        {/* View My Coupons Link */}
        <div className="mt-4">
          <button
            onClick={() => navigate('/my-coupons')}
            className="text-primary-600 hover:text-primary-700 font-medium underline"
          >
            View My Redeemed Coupons →
          </button>
        </div>

        {showCouponDemoTools && (
          <div className="mt-6 mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            <p className="font-semibold mb-1">Demo / execution</p>
            <p className="text-amber-800 mb-3">
              Adds <strong>600 Vitacoins</strong> to your account so you can enable <strong>Redeem Coupon</strong>{' '}
              (e.g. Zepto costs 300). Only works when the API allows demo top-up (local <code className="text-xs bg-amber-100 px-1 rounded">npm run dev</code> on the server).
            </p>
            <button
              type="button"
              onClick={handleDemoTopup}
              disabled={demoTopupLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {demoTopupLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Adding coins…
                </>
              ) : (
                <>+ Add 600 demo coins</>
              )}
            </button>
          </div>
        )}
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <FiAlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      {/* Coupons Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {coupons.map((coupon, index) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-warm-border"
          >
            {/* Coupon Header */}
            <div className={`bg-gradient-to-r ${coupon.color} text-white p-6 text-center`}>
              <div className="text-4xl mb-2">{coupon.logo}</div>
              <h3 className="text-xl font-bold">{coupon.name}</h3>
              <p className="text-sm opacity-90">{coupon.description}</p>
            </div>

            {/* Coupon Body */}
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-warm-text mb-1">
                  {coupon.value}
                </div>
                <div className="text-sm text-gray-500">Coupon Value</div>
              </div>

              <div className="text-center mb-6">
                <div className="text-lg font-semibold text-primary-600 mb-1">
                  <CoinDisplay balance={coupon.cost} size="sm" />
                </div>
                <div className="text-sm text-warm-textSecondary">Cost in Vitacoins</div>
                <p className="text-xs text-warm-textSecondary mt-2">
                  +{COUPON_PRICE_STEP} coins after each time you redeem this brand (same offer).
                </p>
              </div>

                             {/* Redeem Button */}
               <button
                 onClick={() => handleRedeem(coupon)}
                 disabled={redeemingCouponId === coupon.id || userBalance < coupon.cost}
                 className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                   userBalance >= coupon.cost
                     ? 'bg-warm-primary text-white hover:opacity-90 transform hover:scale-105'
                     : 'bg-warm-secondary text-warm-textSecondary cursor-not-allowed'
                 }`}
               >
                 {redeemingCouponId === coupon.id ? (
                   <div className="flex items-center justify-center space-x-2">
                     <LoadingSpinner size="sm" />
                     <span>Redeeming...</span>
                   </div>
                 ) : (
                   <div className="flex items-center justify-center space-x-2">
                     <FiShoppingBag className="w-4 h-4" />
                     <span>Redeem Coupon</span>
                   </div>
                 )}
               </button>

              {/* Insufficient Balance Warning */}
              {userBalance < coupon.cost && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-red-500">
                    Need <CoinDisplay balance={coupon.cost - userBalance} size="xs" /> more
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

             {/* Success Modal */}
       {redeemedCoupon && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-xl p-8 max-w-lg w-full text-center shadow-2xl"
           >
             {/* Success Icon */}
             <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <FiCheckCircle className="w-10 h-10 text-white" />
             </div>
             
             {/* Header */}
             <h3 className="text-2xl font-bold text-warm-text mb-2">🎉 Coupon Redeemed!</h3>
             <p className="text-warm-textSecondary mb-6">
               You've successfully redeemed the <span className="font-semibold text-primary-600">{redeemedCoupon.name}</span> coupon
             </p>

             {/* Coupon Details Card */}
             <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6 border border-primary-200">
               <div className="text-4xl mb-3">{redeemedCoupon.logo}</div>
               <h4 className="text-xl font-bold text-primary-800 mb-2">{redeemedCoupon.name}</h4>
               <p className="text-primary-700 mb-4">{redeemedCoupon.description}</p>
               
               {/* Coupon Code */}
<div className="bg-white rounded-lg p-4 border-2 border-dashed border-warm-border">
                <p className="text-sm text-warm-textSecondary mb-2 font-medium">Your Coupon Code:</p>
                <div className="bg-warm-container rounded-lg p-3">
                   <code className="text-xl font-mono font-bold text-primary-700 tracking-wider">
                     {redeemedCoupon.couponCode}
                   </code>
                 </div>
                 <p className="text-xs text-warm-textSecondary mt-2">Copy this code and use it on {redeemedCoupon.name}</p>
               </div>
             </div>

             {/* Transaction Details */}
             <div className="bg-gray-50 rounded-lg p-4 mb-6">
               <h5 className="font-semibold text-gray-800 mb-3">Transaction Details</h5>
               <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-warm-textSecondary">Coupon Value:</span>
                   <span className="font-semibold text-green-600">{redeemedCoupon.value}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-warm-textSecondary">Cost:</span>
                   <span className="font-semibold text-red-600">
                     <CoinDisplay balance={redeemedCoupon.paidCoins ?? redeemedCoupon.cost} size="sm" />
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-warm-textSecondary">New Balance:</span>
                   <span className="font-semibold text-primary-600">
                     <CoinDisplay balance={userBalance} size="sm" />
                   </span>
                 </div>
                 {redeemedCoupon.transactionId && (
                   <div className="flex justify-between">
<span className="text-warm-textSecondary">Transaction ID:</span>
                    <span className="font-mono text-xs text-warm-textSecondary">{redeemedCoupon.transactionId.slice(-8)}</span>
                   </div>
                 )}
               </div>
             </div>

             {/* Action Buttons */}
             <div className="flex space-x-3">
               <button
                 onClick={async () => {
                   try {
                     await navigator.clipboard.writeText(redeemedCoupon.couponCode);
                     setCopySuccess(true);
                     setTimeout(() => setCopySuccess(false), 2000);
                   } catch (err) {
                     console.error('Failed to copy code:', err);
                   }
                 }}
                 className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                   copySuccess 
                     ? 'bg-green-500 text-white' 
                     : 'bg-secondary-500 text-white hover:bg-secondary-600'
                 }`}
               >
                 {copySuccess ? (
                   <>
                     <FiCheckCircle className="w-4 h-4" />
                     <span>Copied!</span>
                   </>
                 ) : (
                   <>
                     <FiCopy className="w-4 h-4" />
                     <span>Copy Code</span>
                   </>
                 )}
               </button>
               <button
                 onClick={closeSuccessModal}
                 className="flex-1 bg-warm-primary text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-colors"
               >
                 Continue
               </button>
             </div>
           </motion.div>
         </div>
       )}
    </div>
  );
};

export default Coupons;
