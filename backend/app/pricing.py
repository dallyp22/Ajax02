"""
Pricing optimization engine for RentRoll AI Optimizer.

Implements three optimization strategies:
1. Revenue Maximization
2. Lease-Up Time Minimization 
3. Balanced (user-weighted mix)
"""
import logging
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd
from scipy.optimize import minimize_scalar

from app.config import settings
from app.models import OptimizationStrategy

logger = logging.getLogger(__name__)


class DemandCurve:
    """Demand curve modeling for rental units."""
    
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
        
        # Clip probability to reasonable bounds
        return np.clip(prob, 0.05, 0.95)
    
    def expected_days_to_lease(self, price: float, base_price: float) -> float:
        """Calculate expected days to lease based on demand probability."""
        prob = self.probability(price, base_price)
        return 30 / prob  # Days = baseline_period / probability


class PricingOptimizer:
    """Main pricing optimization engine."""
    
    def __init__(self, elasticity: float = None):
        """Initialize optimizer with demand curve."""
        self.demand_curve = DemandCurve(elasticity)
        self.max_adjustment = settings.max_price_adjustment
    
    def revenue_optimization(
        self, 
        unit_data: Dict, 
        comps_data: pd.DataFrame
    ) -> Tuple[float, Optional[float]]:
        """
        Revenue maximization strategy.
        
        Args:
            unit_data: Dictionary with unit information
            comps_data: DataFrame with comparable units data
            
        Returns:
            Tuple of (optimal_price, demand_probability)
        """
        if comps_data.empty:
            logger.warning(f"No comparables for unit {unit_data.get('unit_id')}")
            return unit_data['advertised_rent'], None
        
        base_price = comps_data['comp_price'].median()
        current_rent = unit_data['advertised_rent']
        
        # Define revenue function (negative for minimization)
        def negative_revenue(price: float) -> float:
            demand_prob = self.demand_curve.probability(price, base_price)
            expected_revenue = price * demand_prob * 12  # Annual revenue
            return -expected_revenue
        
        # Set optimization bounds
        min_price = max(base_price * (1 - self.max_adjustment), current_rent * 0.8)
        max_price = min(base_price * (1 + self.max_adjustment), current_rent * 1.3)
        
        try:
            result = minimize_scalar(
                negative_revenue,
                bounds=(min_price, max_price),
                method='bounded'
            )
            
            optimal_price = result.x
            demand_prob = self.demand_curve.probability(optimal_price, base_price)
            
            logger.info(
                f"Revenue optimization for {unit_data.get('unit_id')}: "
                f"${current_rent:.0f} -> ${optimal_price:.0f} "
                f"(demand: {demand_prob:.2%})"
            )
            
            return optimal_price, demand_prob
            
        except Exception as e:
            logger.error(f"Revenue optimization failed: {e}")
            return current_rent, None
    
    def leaseup_optimization(
        self, 
        unit_data: Dict, 
        comps_data: pd.DataFrame
    ) -> Tuple[float, Optional[float]]:
        """
        Lease-up time minimization strategy.
        
        Args:
            unit_data: Dictionary with unit information
            comps_data: DataFrame with comparable units data
            
        Returns:
            Tuple of (optimal_price, demand_probability)
        """
        if comps_data.empty:
            logger.warning(f"No comparables for unit {unit_data.get('unit_id')}")
            return unit_data['advertised_rent'], None
        
        base_price = comps_data['comp_price'].median()
        current_rent = unit_data['advertised_rent']
        
        # Define days to lease function (minimize expected vacancy days)
        def expected_vacancy_days(price: float) -> float:
            return self.demand_curve.expected_days_to_lease(price, base_price)
        
        # Set optimization bounds (more aggressive pricing down allowed)
        min_price = max(base_price * (1 - self.max_adjustment), current_rent * 0.7)
        max_price = min(base_price * (1 + self.max_adjustment * 0.5), current_rent * 1.1)
        
        try:
            result = minimize_scalar(
                expected_vacancy_days,
                bounds=(min_price, max_price),
                method='bounded'
            )
            
            optimal_price = result.x
            demand_prob = self.demand_curve.probability(optimal_price, base_price)
            
            logger.info(
                f"Lease-up optimization for {unit_data.get('unit_id')}: "
                f"${current_rent:.0f} -> ${optimal_price:.0f} "
                f"(demand: {demand_prob:.2%}, days: {result.fun:.1f})"
            )
            
            return optimal_price, demand_prob
            
        except Exception as e:
            logger.error(f"Lease-up optimization failed: {e}")
            return current_rent, None
    
    def balanced_optimization(
        self, 
        unit_data: Dict, 
        comps_data: pd.DataFrame,
        weight: float = 0.5
    ) -> Tuple[float, Optional[float]]:
        """
        Balanced strategy combining revenue and lease-up optimization.
        
        Args:
            unit_data: Dictionary with unit information
            comps_data: DataFrame with comparable units data
            weight: Weight for revenue vs lease-up (0.0=lease_up, 1.0=revenue)
            
        Returns:
            Tuple of (optimal_price, demand_probability)
        """
        # Get individual optimization results
        rev_price, rev_prob = self.revenue_optimization(unit_data, comps_data)
        lease_price, lease_prob = self.leaseup_optimization(unit_data, comps_data)
        
        # Weighted combination
        optimal_price = rev_price * weight + lease_price * (1 - weight)
        
        # Calculate demand probability for blended price
        if comps_data.empty:
            demand_prob = None
        else:
            base_price = comps_data['comp_price'].median()
            demand_prob = self.demand_curve.probability(optimal_price, base_price)
        
        logger.info(
            f"Balanced optimization for {unit_data.get('unit_id')} (w={weight:.2f}): "
            f"${unit_data['advertised_rent']:.0f} -> ${optimal_price:.0f}"
        )
        
        return optimal_price, demand_prob
    
    def optimize_unit(
        self,
        unit_data: Dict,
        comps_data: pd.DataFrame,
        strategy: OptimizationStrategy,
        weight: Optional[float] = None
    ) -> Dict:
        """
        Optimize a single unit using specified strategy.
        
        Args:
            unit_data: Unit information
            comps_data: Comparable units data
            strategy: Optimization strategy to use
            weight: Weight for balanced strategy
            
        Returns:
            Dictionary with optimization results
        """
        current_rent = unit_data['advertised_rent']
        
        # Apply optimization strategy
        if strategy == OptimizationStrategy.REVENUE:
            suggested_rent, demand_prob = self.revenue_optimization(unit_data, comps_data)
        elif strategy == OptimizationStrategy.LEASE_UP:
            suggested_rent, demand_prob = self.leaseup_optimization(unit_data, comps_data)
        elif strategy == OptimizationStrategy.BALANCED:
            suggested_rent, demand_prob = self.balanced_optimization(
                unit_data, comps_data, weight or 0.5
            )
        else:
            raise ValueError(f"Unknown optimization strategy: {strategy}")
        
        # Calculate metrics
        rent_change = suggested_rent - current_rent
        rent_change_pct = (rent_change / current_rent) * 100
        revenue_impact_annual = rent_change * 12
        
        # Calculate expected days to lease
        expected_days = None
        if demand_prob and not comps_data.empty:
            base_price = comps_data['comp_price'].median()
            expected_days = int(self.demand_curve.expected_days_to_lease(suggested_rent, base_price))
        
        # Compile comparable data summary
        comp_data = {}
        if not comps_data.empty:
            comp_data = {
                'total_comps': len(comps_data),
                'avg_comp_price': float(comps_data['comp_price'].mean()),
                'median_comp_price': float(comps_data['comp_price'].median()),
                'min_comp_price': float(comps_data['comp_price'].min()),
                'max_comp_price': float(comps_data['comp_price'].max()),
                'avg_similarity_score': float(comps_data['similarity_score'].mean())
            }
        
        return {
            'unit_id': unit_data['unit_id'],
            'current_rent': current_rent,
            'suggested_rent': round(suggested_rent, 2),
            'rent_change': round(rent_change, 2),
            'rent_change_pct': round(rent_change_pct, 2),
            'confidence': demand_prob,
            'strategy_used': strategy,
            'demand_probability': demand_prob,
            'expected_days_to_lease': expected_days,
            'revenue_impact_annual': round(revenue_impact_annual, 2),
            'comp_data': comp_data
        }


# Factory function for creating optimizer instances
def create_optimizer(elasticity: Optional[float] = None) -> PricingOptimizer:
    """Create a pricing optimizer instance."""
    return PricingOptimizer(elasticity) 