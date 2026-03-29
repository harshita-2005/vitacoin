import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiGift, FiFilter } from 'react-icons/fi';
import axios from 'axios';

/** Brands in the Vitacoin coupon catalog (same order as Coupons page) */
const COUPON_COMPANIES = [
  'Amazon',
  'Flipkart',
  'Zepto',
  'Swiggy',
  'Zomato',
  'Myntra'
];

const FILTER_ALL = 'all';

const MyCoupons = () => {
  const [redeemedCoupons, setRedeemedCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState(FILTER_ALL);

  const filteredCoupons = useMemo(() => {
    if (companyFilter === FILTER_ALL) return redeemedCoupons;
    return redeemedCoupons.filter((c) => c.name === companyFilter);
  }, [redeemedCoupons, companyFilter]);

  useEffect(() => {
    fetchRedeemedCoupons();
  }, []);

  const fetchRedeemedCoupons = async () => {
    try {
      setLoading(true);
      // For now, we'll get transactions with coupon_redemption category
      const response = await axios.get('/api/transactions?category=coupon_redemption&limit=50');
      
      // Transform transactions into coupon format
      const coupons = response.data.transactions.map(transaction => ({
        id: transaction._id,
        name: extractCouponName(transaction.description),
        value: extractCouponValue(transaction.description),
        cost: Math.abs(transaction.amount || 0),
        redeemedAt: transaction.createdAt,
        description: transaction.description
      }));

      setRedeemedCoupons(coupons);
    } catch (error) {
      console.error('Error fetching redeemed coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractCouponName = (description) => {
    // Extract coupon name from description like "Redeemed Amazon coupon worth ₹50"
    const match = description.match(/Redeemed (\w+) coupon/);
    return match ? match[1] : 'Unknown Coupon';
  };

  const extractCouponValue = (description) => {
    // Extract coupon value from description like "Redeemed Amazon coupon worth ₹50"
    const match = description.match(/worth (₹\d+)/);
    return match ? match[1] : 'Unknown Value';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <FiGift className="inline-block w-10 h-10 mr-3 text-primary-600" />
          My Redeemed Coupons
        </h1>
        <p className="text-lg text-gray-600">
          Track all the coupons you've redeemed with your Vitacoins
        </p>
      </motion.div>

      {/* Filter by company */}
      {redeemedCoupons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-2 text-gray-700">
            <FiFilter className="w-5 h-5 text-primary-600 shrink-0" aria-hidden />
            <span className="font-medium">Filter by company</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="coupon-company-filter" className="sr-only">
              Company
            </label>
            <select
              id="coupon-company-filter"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full sm:min-w-[220px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value={FILTER_ALL}>All companies</option>
              {COUPON_COMPANIES.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500 whitespace-nowrap tabular-nums">
              {filteredCoupons.length} of {redeemedCoupons.length}
            </span>
          </div>
        </motion.div>
      )}

      {/* Coupons List */}
      {redeemedCoupons.length > 0 ? (
        filteredCoupons.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredCoupons.map((coupon, index) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <FiGift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{coupon.name}</h3>
                    <p className="text-gray-600">{coupon.description}</p>
                    <p className="text-sm text-gray-500">
                      Redeemed on {new Date(coupon.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {coupon.value}
                  </div>
                  <div className="text-sm text-gray-500">
                    Cost: <span className="font-medium">{coupon.cost} Vitacoins</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 max-w-md mx-auto"
          >
            <FiFilter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No coupons for this company</h3>
            <p className="text-gray-500 mb-4">
              You haven&apos;t redeemed any {companyFilter} coupons yet. Try another company or show all.
            </p>
            <button
              type="button"
              onClick={() => setCompanyFilter(FILTER_ALL)}
              className="text-primary-600 font-medium hover:text-primary-700 underline"
            >
              Show all companies
            </button>
          </motion.div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <FiGift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Coupons Redeemed Yet</h3>
          <p className="text-gray-500">
            You haven't redeemed any coupons yet. Start spending your Vitacoins to see them here!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MyCoupons;
