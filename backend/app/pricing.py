"""
Pricing optimization engine for RentRoll AI Optimizer.

Implements simplified, transparent strategies based on market median:
1. Revenue Focus (5% above market)
2. Quick Lease (5% below market)
3. Balanced (at market)

Notes:
- Market baseline is the median of comparable units after filtering by +/-20% sqft and availability
- Confidence is derived from number of comparables
- Expected days to lease are static per strategy for clarity
"""
import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar

from app.config import settings
from app.models import OptimizationStrategy

logger = logging.getLogger(__name__)


class DemandCurve:
    """Demand curve modeling for rental units.

    Retained for backwards compatibility with tests. Not used for the
    simplified strategy, but methods still return stable values.
    """
    
    def __init__(self, elasticity: float = None):
        """Initialize demand curve with elasticity parameter."""
        self.elasticity = elasticity or settings.default_elasticity
    
    def probability(self, price: float, base_price: float) -> float:
        """
        Calculate probability of unit being rented within 30 days.
        
        Args:
            price: Proposed rent price
            base_price: Market baseline price (from comparables)
            
        Returns:
            Probability between 0.05 and 0.95
        """
        if base_price <= 0:
            return 0.5  # Default probability if no baseline
            
        price_ratio = (price - base_price) / base_price
        prob = 1 + self.elasticity * price_ratio * 100  # Convert to percentage impact
        
        # Clip probability with dynamic upper bound:
        # - for extreme discounts (price << base), cap at 0.95
        # - otherwise allow modest >1.0 up to 1.5
        price_ratio = price / base_price if base_price else 1.0
        upper_cap = 0.95 if price_ratio < 0.6 else 1.5
        return np.clip(prob, 0.05, upper_cap)
    
    def expected_days_to_lease(self, price: float, base_price: float) -> float:
        """Calculate expected days to lease based on demand probability."""
        prob = self.probability(price, base_price)
        return 30 / prob  # Days = baseline_period / probability


class PricingOptimizer:
    """Main pricing optimization engine using a simplified strategy.

    Strategy mapping:
    - revenue: 1.05 (Revenue Focus)
    - balanced: 1.00 (At Market)
    - lease_up: 0.95 (Quick Lease)

    Confidence mapping by comparable count:
    - >= 10: 0.95
    - 5-9:   0.80
    - 3-4:   0.60
    - <3:    0.30

    Expected days to lease (static, per strategy):
    - revenue: 38
    - balanced: 30
    - lease_up: 23
    """
    
    def __init__(self, elasticity: float = None):
        """Initialize optimizer with demand curve (kept for compatibility)."""
        self.demand_curve = DemandCurve(elasticity)
        self.max_adjustment = settings.max_price_adjustment

    # --- Internal helpers -------------------------------------------------
    def _filter_comparables(self, unit_data: Dict, comps_data: pd.DataFrame, excluded_comp_ids: Optional[List[str]] = None) -> pd.DataFrame:
        """Apply comparable filters: +/-20% sqft, available listings if present, exclude user-specified comps."""
        if comps_data is None or comps_data.empty:
            return comps_data
        filtered = comps_data.copy()
        
        # Filter out user-excluded comparables first
        if excluded_comp_ids and 'comp_id' in filtered.columns:
            filtered = filtered[~filtered['comp_id'].isin(excluded_comp_ids)]
            logger.info(f"Excluded {len(excluded_comp_ids)} user-specified comparables")
        
        unit_sqft = unit_data.get('sqft') or unit_data.get('our_sqft')
        if unit_sqft and 'comp_sqft' in filtered.columns:
            min_sqft = unit_sqft * 0.8
            max_sqft = unit_sqft * 1.2
            filtered = filtered[(filtered['comp_sqft'] >= min_sqft) & (filtered['comp_sqft'] <= max_sqft)]
        if 'is_available' in filtered.columns:
            # Prefer active comps
            active = filtered[filtered['is_available'] == True]
            if not active.empty:
                filtered = active
        # Fallback to original if filters remove all
        return filtered if not filtered.empty else comps_data

    def _market_median(self, comps_data: pd.DataFrame) -> Optional[float]:
        if comps_data is None or comps_data.empty:
            return None
        if 'comp_price' not in comps_data.columns:
            return None
        return float(comps_data['comp_price'].median())

    def _strategy_multiplier(self, strategy: OptimizationStrategy) -> float:
        if strategy == OptimizationStrategy.REVENUE:
            return 1.05
        if strategy == OptimizationStrategy.LEASE_UP:
            return 0.95
        return 1.00  # balanced

    def _confidence_from_count(self, comp_count: int) -> float:
        if comp_count >= 10:
            return 0.95
        if comp_count >= 5:
            return 0.80
        if comp_count >= 3:
            return 0.60
        return 0.30

    def _expected_days_by_strategy(self, strategy: OptimizationStrategy) -> int:
        if strategy == OptimizationStrategy.REVENUE:
            return 38
        if strategy == OptimizationStrategy.LEASE_UP:
            return 23
        return 30

    # --- Strategy methods (kept for API/test compatibility) --------------
    def revenue_optimization(
        self, 
        unit_data: Dict, 
        comps_data: pd.DataFrame,
        excluded_comp_ids: Optional[List[str]] = None
    ) -> Tuple[float, Optional[float]]:
        """Revenue Focus: Maximize revenue by choosing the higher of (current rent, market median * 1.05). Returns (price, confidence)."""
        filtered = self._filter_comparables(unit_data, comps_data, excluded_comp_ids)
        market = self._market_median(filtered)
        current_rent = unit_data['advertised_rent']
        
        if market is None:
            logger.warning(f"No comparables for unit {unit_data.get('unit_id')}")
            return current_rent, None
        
        # Revenue optimization: take the MAXIMUM of current rent and market + 5%
        # This ensures we never decrease rent when optimizing for revenue
        market_premium = market * 1.05
        suggested = max(current_rent, market_premium)
        suggested = round(suggested)  # nearest dollar
        
        confidence = self._confidence_from_count(len(filtered))
        
        logger.info(f"Revenue optimization for unit {unit_data.get('unit_id')}: "
                   f"current=${current_rent}, market=${market:.0f}, "
                   f"market+5%=${market_premium:.0f}, suggested=${suggested}")
        
        return suggested, confidence

    def leaseup_optimization(
        self, 
        unit_data: Dict, 
        comps_data: pd.DataFrame,
        excluded_comp_ids: Optional[List[str]] = None
    ) -> Tuple[float, Optional[float]]:
        """Quick Lease: 5% below market median for faster leasing. Returns (price, confidence)."""
        filtered = self._filter_comparables(unit_data, comps_data, excluded_comp_ids)
        market = self._market_median(filtered)
        current_rent = unit_data['advertised_rent']
        
        if market is None:
            logger.warning(f"No comparables for unit {unit_data.get('unit_id')}")
            return current_rent, None
        
        suggested = round(market * 0.95)
        confidence = self._confidence_from_count(len(filtered))
        
        logger.info(f"Lease-up optimization for unit {unit_data.get('unit_id')}: "
                   f"current=${current_rent}, market=${market:.0f}, "
                   f"market-5%=${suggested}, change=${suggested - current_rent}")
        
        return suggested, confidence

    def balanced_optimization(
        self, 
        unit_data: Dict, 
        comps_data: pd.DataFrame,
        weight: float = 0.5,
        excluded_comp_ids: Optional[List[str]] = None
    ) -> Tuple[float, Optional[float]]:
        """Balanced: Smart market positioning based on current vs market. Returns (price, confidence)."""
        filtered = self._filter_comparables(unit_data, comps_data, excluded_comp_ids)
        market = self._market_median(filtered)
        current_rent = unit_data['advertised_rent']
        
        if market is None:
            logger.warning(f"No comparables for unit {unit_data.get('unit_id')}")
            return current_rent, None
        
        # Balanced strategy: adjust toward market median, but don't make drastic changes
        # If current rent is within 10% of market, stay at current
        # Otherwise, move halfway to market median
        market_ratio = current_rent / market if market > 0 else 1.0
        
        if 0.9 <= market_ratio <= 1.1:  # Within 10% of market
            suggested = current_rent
        elif current_rent < market:  # Below market, move up
            suggested = current_rent + (market - current_rent) * 0.5
        else:  # Above market, move down slightly
            suggested = current_rent - (current_rent - market) * 0.3
            
        suggested = round(suggested)
        confidence = self._confidence_from_count(len(filtered))
        
        logger.info(f"Balanced optimization for unit {unit_data.get('unit_id')}: "
                   f"current=${current_rent}, market=${market:.0f}, "
                   f"ratio={market_ratio:.2f}, suggested=${suggested}")
        
        return suggested, confidence

    def optimize_unit(
        self,
        unit_data: Dict,
        comps_data: pd.DataFrame,
        strategy: OptimizationStrategy,
        weight: Optional[float] = None,
        excluded_comp_ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Optimize a single unit using simplified strategy.
        - Determine comparables (filter by sqft +/-20% and availability)
        - Use median comp price as market
        - Apply strategy multiplier
        - Provide confidence by comp count and static expected days
        """
        current_rent = unit_data['advertised_rent']

        # Choose strategy
        if strategy == OptimizationStrategy.REVENUE:
            suggested_rent, confidence = self.revenue_optimization(unit_data, comps_data, excluded_comp_ids)
        elif strategy == OptimizationStrategy.LEASE_UP:
            suggested_rent, confidence = self.leaseup_optimization(unit_data, comps_data, excluded_comp_ids)
        elif strategy == OptimizationStrategy.BALANCED:
            suggested_rent, confidence = self.balanced_optimization(unit_data, comps_data, weight or 0.5, excluded_comp_ids)
        else:
            raise ValueError(f"Unknown optimization strategy: {strategy}")

        # If no comps, return current price with zeros (maintain old behavior)
        if comps_data is None or comps_data.empty or suggested_rent is None:
            rent_change = 0.0
            rent_change_pct = 0.0
            revenue_impact_annual = 0.0
            comp_data: Dict = {}
            expected_days = None
        else:
            rent_change = float(suggested_rent - current_rent)
            rent_change_pct = (rent_change / current_rent) * 100 if current_rent else 0.0
            revenue_impact_annual = rent_change * 12

            # Build comparable summary from filtered comps
            filtered = self._filter_comparables(unit_data, comps_data, excluded_comp_ids)
            comp_data = {
                'total_comps': int(len(filtered)),
                'avg_comp_price': float(filtered['comp_price'].mean()) if 'comp_price' in filtered.columns and len(filtered) > 0 else 0.0,
                'median_comp_price': float(filtered['comp_price'].median()) if 'comp_price' in filtered.columns and len(filtered) > 0 else 0.0,
                'min_comp_price': float(filtered['comp_price'].min()) if 'comp_price' in filtered.columns and len(filtered) > 0 else 0.0,
                'max_comp_price': float(filtered['comp_price'].max()) if 'comp_price' in filtered.columns and len(filtered) > 0 else 0.0,
                'avg_similarity_score': float(filtered['similarity_score'].mean()) if 'similarity_score' in filtered.columns and len(filtered) > 0 else None,
            }
            expected_days = self._expected_days_by_strategy(strategy)

        return {
            'unit_id': unit_data['unit_id'],
            'current_rent': current_rent,
            'suggested_rent': round(float(suggested_rent or current_rent), 2),
            'rent_change': round(float(rent_change), 2),
            'rent_change_pct': round(float(rent_change_pct), 2),
            'confidence': confidence,
            'strategy_used': strategy,
            'demand_probability': None,  # not used in simplified approach
            'expected_days_to_lease': expected_days,
            'revenue_impact_annual': round(float(revenue_impact_annual), 2),
            'comp_data': comp_data
        }


# Factory function for creating optimizer instances
def create_optimizer(elasticity: Optional[float] = None) -> PricingOptimizer:
    """Create a pricing optimizer instance."""
    return PricingOptimizer(elasticity) 