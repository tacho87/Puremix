"""
Financial Analysis Module
Independent Python file that can be imported and called like a JavaScript module
Demonstrates language-agnostic integration in PureMix framework
"""

import json
import math
from datetime import datetime, timedelta


def calculate_loan_amortization(loan_data, js_context=None):
    """
    Calculate comprehensive loan amortization schedule

    Args:
        loan_data: Dict with keys: principal, rate, years, extra_payment
        js_context: JavaScript context from calling environment

    Returns:
        Dict with complete amortization analysis
    """
    try:
        principal = float(loan_data.get('principal', 0))
        annual_rate = float(loan_data.get('rate', 0)) / 100
        years = int(loan_data.get('years', 30))
        extra_payment = float(loan_data.get('extra_payment', 0))

        if principal <= 0 or annual_rate < 0 or years <= 0:
            return {
                'success': False,
                'error': 'Invalid loan parameters'
            }

        monthly_rate = annual_rate / 12
        num_payments = years * 12

        # Standard monthly payment calculation
        if monthly_rate > 0:
            monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**num_payments) / ((1 + monthly_rate)**num_payments - 1)
        else:
            monthly_payment = principal / num_payments

        # Generate payment schedule
        schedule = []
        remaining_balance = principal
        total_interest = 0

        for month in range(1, num_payments + 1):
            if remaining_balance <= 0.01:
                break

            interest_payment = remaining_balance * monthly_rate
            principal_payment = min(monthly_payment - interest_payment + extra_payment, remaining_balance)
            remaining_balance -= principal_payment
            total_interest += interest_payment

            schedule.append({
                'month': month,
                'payment': round(monthly_payment + extra_payment, 2),
                'principal': round(principal_payment, 2),
                'interest': round(interest_payment, 2),
                'balance': round(remaining_balance, 2),
                'cumulative_interest': round(total_interest, 2)
            })

        # Calculate savings with extra payments
        standard_total_interest = (monthly_payment * num_payments) - principal
        interest_savings = standard_total_interest - total_interest
        months_saved = num_payments - len(schedule)

        return {
            'success': True,
            'method': 'Python financial_analyzer.py module',
            'monthly_payment': round(monthly_payment, 2),
            'total_interest': round(total_interest, 2),
            'interest_savings': round(interest_savings, 2),
            'months_saved': months_saved,
            'years_saved': round(months_saved / 12, 1),
            'total_payments': len(schedule),
            'schedule': schedule[:12],  # First year
            'summary': {
                'original_loan': principal,
                'total_paid': round(principal + total_interest, 2),
                'interest_portion': round((total_interest / (principal + total_interest)) * 100, 1)
            },
            'context_info': f"Called from {js_context.get('request', {}).get('url', 'unknown')} at {datetime.now().isoformat()}" if js_context else 'No context',
            'framework_integration': 'independent Python module'
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Calculation failed: {str(e)}',
            'method': 'Python financial_analyzer.py module'
        }


def analyze_investment_portfolio(portfolio_data, js_context=None):
    """
    Analyze investment portfolio with risk assessment

    Args:
        portfolio_data: Dict with investment data
        js_context: JavaScript context

    Returns:
        Dict with portfolio analysis
    """
    try:
        investments = portfolio_data.get('investments', [])

        if not investments:
            return {
                'success': False,
                'error': 'No investments provided'
            }

        total_value = sum(inv.get('value', 0) for inv in investments)
        total_cost = sum(inv.get('cost', 0) for inv in investments)

        # Calculate portfolio metrics
        portfolio_gain = total_value - total_cost
        portfolio_return = (portfolio_gain / total_cost * 100) if total_cost > 0 else 0

        # Risk analysis based on asset types
        risk_weights = {
            'stocks': 0.8,
            'bonds': 0.3,
            'crypto': 1.2,
            'real_estate': 0.5,
            'cash': 0.1
        }

        weighted_risk = 0
        for investment in investments:
            asset_type = investment.get('type', 'stocks').lower()
            weight = investment.get('value', 0) / total_value if total_value > 0 else 0
            risk_factor = risk_weights.get(asset_type, 0.7)
            weighted_risk += weight * risk_factor

        risk_level = 'low' if weighted_risk < 0.4 else 'medium' if weighted_risk < 0.7 else 'high'

        # Diversification analysis
        asset_types = {}
        for investment in investments:
            asset_type = investment.get('type', 'unknown')
            if asset_type not in asset_types:
                asset_types[asset_type] = {'count': 0, 'value': 0}
            asset_types[asset_type]['count'] += 1
            asset_types[asset_type]['value'] += investment.get('value', 0)

        diversification_score = len(asset_types) * 20  # Simple diversification metric
        diversification_score = min(diversification_score, 100)

        return {
            'success': True,
            'method': 'Python financial_analyzer.py module',
            'portfolio_value': round(total_value, 2),
            'portfolio_cost': round(total_cost, 2),
            'portfolio_gain': round(portfolio_gain, 2),
            'portfolio_return': round(portfolio_return, 2),
            'risk_assessment': {
                'level': risk_level,
                'score': round(weighted_risk * 100, 1),
                'recommendation': f"Your portfolio has {risk_level} risk with a score of {round(weighted_risk * 100, 1)}/100"
            },
            'diversification': {
                'score': diversification_score,
                'asset_types': asset_types,
                'recommendation': 'well diversified' if diversification_score >= 80 else 'consider more diversification'
            },
            'asset_breakdown': [
                {
                    'type': asset_type,
                    'count': data['count'],
                    'value': round(data['value'], 2),
                    'percentage': round((data['value'] / total_value) * 100, 1) if total_value > 0 else 0
                }
                for asset_type, data in asset_types.items()
            ],
            'context_info': f"Analysis from {js_context.get('request', {}).get('method', 'unknown')} request" if js_context else 'No context',
            'framework_integration': 'independent Python module'
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Portfolio analysis failed: {str(e)}',
            'method': 'Python financial_analyzer.py module'
        }


def calculate_retirement_planning(retirement_data, js_context=None):
    """
    Calculate retirement savings projections

    Args:
        retirement_data: Dict with retirement planning parameters
        js_context: JavaScript context

    Returns:
        Dict with retirement analysis
    """
    try:
        current_age = int(retirement_data.get('current_age', 30))
        retirement_age = int(retirement_data.get('retirement_age', 65))
        current_savings = float(retirement_data.get('current_savings', 0))
        monthly_contribution = float(retirement_data.get('monthly_contribution', 500))
        expected_return = float(retirement_data.get('expected_return', 7)) / 100

        years_to_retirement = retirement_age - current_age

        if years_to_retirement <= 0:
            return {
                'success': False,
                'error': 'Retirement age must be greater than current age'
            }

        monthly_return = expected_return / 12
        total_months = years_to_retirement * 12

        # Future value of current savings
        future_current_savings = current_savings * (1 + expected_return) ** years_to_retirement

        # Future value of monthly contributions (annuity)
        if monthly_return > 0:
            future_contributions = monthly_contribution * (((1 + monthly_return) ** total_months - 1) / monthly_return)
        else:
            future_contributions = monthly_contribution * total_months

        total_retirement_savings = future_current_savings + future_contributions

        # Calculate monthly retirement income (4% rule)
        safe_withdrawal_rate = 0.04
        monthly_retirement_income = (total_retirement_savings * safe_withdrawal_rate) / 12

        # Milestones
        milestones = []
        for year in [5, 10, 15, 20, 25]:
            if year <= years_to_retirement:
                future_savings_at_year = current_savings * (1 + expected_return) ** year
                if monthly_return > 0:
                    future_contributions_at_year = monthly_contribution * (((1 + monthly_return) ** (year * 12) - 1) / monthly_return)
                else:
                    future_contributions_at_year = monthly_contribution * (year * 12)

                total_at_year = future_savings_at_year + future_contributions_at_year
                milestones.append({
                    'year': year,
                    'age': current_age + year,
                    'total_savings': round(total_at_year, 2),
                    'monthly_income_potential': round((total_at_year * safe_withdrawal_rate) / 12, 2)
                })

        return {
            'success': True,
            'method': 'Python financial_analyzer.py module',
            'years_to_retirement': years_to_retirement,
            'total_retirement_savings': round(total_retirement_savings, 2),
            'monthly_retirement_income': round(monthly_retirement_income, 2),
            'annual_retirement_income': round(monthly_retirement_income * 12, 2),
            'contribution_impact': {
                'from_current_savings': round(future_current_savings, 2),
                'from_contributions': round(future_contributions, 2),
                'total_contributions': round(monthly_contribution * total_months, 2),
                'investment_growth': round(future_contributions - (monthly_contribution * total_months), 2)
            },
            'milestones': milestones,
            'recommendations': {
                'retirement_readiness': 'excellent' if monthly_retirement_income > 5000 else 'good' if monthly_retirement_income > 3000 else 'needs improvement',
                'suggestion': f"To reach $5000/month retirement income, consider increasing monthly contributions" if monthly_retirement_income < 5000 else "You're on track for a comfortable retirement"
            },
            'context_info': f"Calculated for user session {js_context.get('session', {}).get('id', 'anonymous')}" if js_context else 'No context',
            'framework_integration': 'independent Python module'
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Retirement calculation failed: {str(e)}',
            'method': 'Python financial_analyzer.py module'
        }


# Module-level function for testing framework integration
def test_module_integration(test_data, js_context=None):
    """Test that this Python module can be called like a JavaScript module"""
    return {
        'success': True,
        'message': 'Python module working as independent file!',
        'module_name': __name__,
        'available_functions': [
            'calculate_loan_amortization',
            'analyze_investment_portfolio',
            'calculate_retirement_planning',
            'test_module_integration'
        ],
        'test_data_received': test_data,
        'context_available': js_context is not None,
        'framework_integration': 'Language-agnostic: Python file callable like JavaScript module',
        'timestamp': datetime.now().isoformat()
    }