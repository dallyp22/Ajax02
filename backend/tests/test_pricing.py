"""
Unit tests for the pricing optimization engine.
"""
import pytest
import pandas as pd
from app.pricing import DemandCurve, PricingOptimizer
from app.models import OptimizationStrategy


class TestDemandCurve:
    """Test the demand curve modeling functionality."""
    
    def test_default_elasticity(self):
        """Test demand curve with default elasticity."""
        curve = DemandCurve()
        assert curve.elasticity == -0.003
    
    def test_custom_elasticity(self):
        """Test demand curve with custom elasticity."""
        curve = DemandCurve(elasticity=-0.005)
        assert curve.elasticity == -0.005
    
    def test_probability_calculation(self):
        """Test probability calculation."""
        curve = DemandCurve(elasticity=-0.003)
        
        # Test equal price
        prob = curve.probability(2000, 2000)
        assert prob == 1.0
        
        # Test higher price (should decrease probability)
        prob = curve.probability(2200, 2000)
        assert prob < 1.0
        
        # Test lower price (should increase probability)
        prob = curve.probability(1800, 2000)
        assert prob > 1.0
        
        # Test bounds
        prob = curve.probability(5000, 2000)  # Very high price
        assert prob >= 0.05  # Should be clipped to minimum
        
        prob = curve.probability(500, 2000)  # Very low price
        assert prob <= 0.95  # Should be clipped to maximum
    
    def test_expected_days_to_lease(self):
        """Test expected days to lease calculation."""
        curve = DemandCurve()
        
        # High probability should result in fewer days
        days_low_price = curve.expected_days_to_lease(1800, 2000)
        days_high_price = curve.expected_days_to_lease(2200, 2000)
        
        assert days_low_price < days_high_price


class TestPricingOptimizer:
    """Test the pricing optimization engine."""
    
    def setup_method(self):
        """Set up test data."""
        self.optimizer = PricingOptimizer()
        
        # Sample unit data
        self.unit_data = {
            'unit_id': 'TEST_001',
            'property': 'Test Property',
            'bed': 2,
            'bath': 2,
            'sqft': 1000,
            'advertised_rent': 2000,
            'status': 'VACANT'
        }
        
        # Sample comparables data
        self.comps_data = pd.DataFrame([
            {
                'comp_id': 'COMP_001',
                'comp_property': 'Competitor A',
                'comp_price': 1950,
                'similarity_score': 85,
                'sqft_delta_pct': 0.05
            },
            {
                'comp_id': 'COMP_002', 
                'comp_property': 'Competitor B',
                'comp_price': 2050,
                'similarity_score': 80,
                'sqft_delta_pct': 0.10
            },
            {
                'comp_id': 'COMP_003',
                'comp_property': 'Competitor C', 
                'comp_price': 2000,
                'similarity_score': 90,
                'sqft_delta_pct': 0.02
            }
        ])
    
    def test_revenue_optimization(self):
        """Test revenue optimization strategy."""
        result = self.optimizer.revenue_optimization(self.unit_data, self.comps_data)
        
        assert isinstance(result, tuple)
        assert len(result) == 2
        
        suggested_rent, demand_prob = result
        assert isinstance(suggested_rent, (int, float))
        assert suggested_rent > 0
        assert demand_prob is None or (0 <= demand_prob <= 1)
    
    def test_leaseup_optimization(self):
        """Test lease-up optimization strategy."""
        result = self.optimizer.leaseup_optimization(self.unit_data, self.comps_data)
        
        assert isinstance(result, tuple)
        assert len(result) == 2
        
        suggested_rent, demand_prob = result
        assert isinstance(suggested_rent, (int, float))
        assert suggested_rent > 0
        assert demand_prob is None or (0 <= demand_prob <= 1)
    
    def test_balanced_optimization(self):
        """Test balanced optimization strategy."""
        result = self.optimizer.balanced_optimization(
            self.unit_data, self.comps_data, weight=0.5
        )
        
        assert isinstance(result, tuple)
        assert len(result) == 2
        
        suggested_rent, demand_prob = result
        assert isinstance(suggested_rent, (int, float))
        assert suggested_rent > 0
        assert demand_prob is None or (0 <= demand_prob <= 1)
    
    def test_optimize_unit_revenue(self):
        """Test optimize_unit with revenue strategy."""
        result = self.optimizer.optimize_unit(
            self.unit_data,
            self.comps_data,
            OptimizationStrategy.REVENUE
        )
        
        assert isinstance(result, dict)
        assert 'unit_id' in result
        assert 'suggested_rent' in result
        assert 'rent_change' in result
        assert 'strategy_used' in result
        assert result['strategy_used'] == OptimizationStrategy.REVENUE
    
    def test_optimize_unit_leaseup(self):
        """Test optimize_unit with lease-up strategy."""
        result = self.optimizer.optimize_unit(
            self.unit_data,
            self.comps_data,
            OptimizationStrategy.LEASE_UP
        )
        
        assert isinstance(result, dict)
        assert result['strategy_used'] == OptimizationStrategy.LEASE_UP
    
    def test_optimize_unit_balanced(self):
        """Test optimize_unit with balanced strategy."""
        result = self.optimizer.optimize_unit(
            self.unit_data,
            self.comps_data,
            OptimizationStrategy.BALANCED,
            weight=0.7
        )
        
        assert isinstance(result, dict)
        assert result['strategy_used'] == OptimizationStrategy.BALANCED
    
    def test_empty_comparables(self):
        """Test optimization with no comparables."""
        empty_comps = pd.DataFrame()
        
        result = self.optimizer.optimize_unit(
            self.unit_data,
            empty_comps,
            OptimizationStrategy.REVENUE
        )
        
        # Should return current rent when no comparables
        assert result['suggested_rent'] == self.unit_data['advertised_rent']
        assert result['rent_change'] == 0
    
    def test_invalid_strategy(self):
        """Test optimization with invalid strategy."""
        with pytest.raises(ValueError):
            self.optimizer.optimize_unit(
                self.unit_data,
                self.comps_data,
                "invalid_strategy"
            )


if __name__ == '__main__':
    pytest.main([__file__]) 