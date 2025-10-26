"""
Advanced Financial Calculator Service

Comprehensive financial analysis with ML-style insights and data embeddings.
Handles loan calculations, amortization schedules, risk assessment, and portfolio analytics.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json


def analyze_custom_loan(loan_data, js_context=None):
    """
    Analyze a single custom loan with comprehensive metrics

    Args:
        loan_data (dict): Loan parameters including principal, rate, years, etc.
        js_context (dict): Optional JavaScript context data

    Returns:
        dict: Comprehensive loan analysis with metrics, risk assessment, and recommendations
    """
    try:
        # Use JSON-compatible logging instead of print
        import json
        # Debug: print to stderr instead of stdout to avoid JSON contamination
        import sys
        print("🐍 Python received loan_data:", json.dumps(loan_data, indent=2), file=sys.stderr)
        # Robust parameter extraction with type conversion
        principal = float(loan_data.get('principal', 0))
        rate = float(loan_data.get('rate', 0))
        years = int(loan_data.get('years', 0))
        extra_payment = float(loan_data.get('extraPayment', 0))
        loan_type = loan_data.get('type', 'other')
        loan_name = loan_data.get('name', 'Custom Loan')

        # Enhanced validation with detailed error messages
        if principal <= 0:
            return {
                'success': False,
                'error': f'Principal amount must be greater than 0. Received: {principal}'
            }

        if rate < 0:
            return {
                'success': False,
                'error': f'Interest rate cannot be negative. Received: {rate}%'
            }

        if years <= 0:
            return {
                'success': False,
                'error': f'Loan term must be greater than 0 years. Received: {years} years'
            }

        if extra_payment < 0:
            return {
                'success': False,
                'error': f'Extra payment cannot be negative. Received: ${extra_payment:,.2f}'
            }

        # Calculate core loan metrics
        annual_rate = rate / 100
        monthly_rate = annual_rate / 12
        num_payments = years * 12

        # Calculate monthly payment using compound interest formula
        if monthly_rate > 0:
            monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**num_payments) / ((1 + monthly_rate)**num_payments - 1)
        else:
            monthly_payment = principal / num_payments

        # Generate complete amortization schedule with pandas
        payment_data = []
        remaining_balance = principal
        total_interest = 0
        total_principal = 0

        for payment_num in range(1, num_payments + 1):
            interest_payment = remaining_balance * monthly_rate
            principal_payment = monthly_payment - interest_payment + extra_payment

            # Ensure we don't overpay on the last payment
            if principal_payment > remaining_balance:
                principal_payment = remaining_balance
                extra_payment_actual = 0
            else:
                extra_payment_actual = extra_payment

            remaining_balance -= principal_payment
            total_interest += interest_payment
            total_principal += principal_payment

            payment_data.append({
                'payment_number': payment_num,
                'payment_date': f'Payment {payment_num}',
                'principal': round(principal_payment - extra_payment_actual, 2),
                'extra_principal': round(extra_payment_actual, 2),
                'interest': round(interest_payment, 2),
                'total_payment': round(monthly_payment + extra_payment_actual, 2),
                'remaining_balance': round(max(0, remaining_balance), 2)
            })

            if remaining_balance <= 0:
                break

        # Create DataFrame for advanced analytics
        df = pd.DataFrame(payment_data)

        # Calculate summary metrics
        actual_payments = len(df)
        months_saved = num_payments - actual_payments
        years_saved = months_saved / 12
        total_cost = principal + total_interest

        # Risk assessment calculations
        debt_to_income_ratio = 35.0  # Estimated, would need actual income
        payment_to_income_ratio = (monthly_payment + extra_payment) / 5000 * 100  # Estimated income

        # Risk scoring algorithm
        risk_factors = []
        risk_score = 0

        if payment_to_income_ratio > 28:
            risk_factors.append("High payment-to-income ratio")
            risk_score += 25

        if years > 30:
            risk_factors.append("Very long loan term")
            risk_score += 20
        elif years > 15:
            risk_factors.append("Long loan term")
            risk_score += 10

        if rate > 8:
            risk_factors.append("High interest rate")
            risk_score += 20
        elif rate > 5:
            risk_factors.append("Moderate interest rate")
            risk_score += 10

        if principal > 500000:
            risk_factors.append("Large loan amount")
            risk_score += 15

        # Determine risk level and color
        if risk_score <= 20:
            risk_level = "Low Risk"
            risk_color = "green"
        elif risk_score <= 40:
            risk_level = "Moderate Risk"
            risk_color = "orange"
        else:
            risk_level = "High Risk"
            risk_color = "red"

        # Extra payment analysis
        extra_payment_savings = (num_payments * monthly_payment) - (actual_payments * monthly_payment + df['extra_principal'].sum())
        efficiency_ratio = extra_payment_savings / (extra_payment * actual_payments) if extra_payment > 0 else 0

        # Advanced analytics
        df['interest_trend'] = df['interest'].pct_change() * 100
        interest_trend = df['interest_trend'].mean()
        crossover_month = df[df['principal'] > df['interest']].iloc[0]['payment_number'] if len(df[df['principal'] > df['interest']]) > 0 else actual_payments

        # Financial embeddings (ML-style feature vectors)
        loan_embedding = {
            'financial_vector': [
                principal / 100000,           # Loan size (normalized)
                rate / 10,                    # Interest rate (normalized)
                years / 30,                   # Term length (normalized)
                extra_payment / 1000,         # Extra payment (normalized)
                total_interest / principal,   # Interest ratio
                debt_to_income_ratio / 100,   # DTI ratio (normalized)
                risk_score / 100             # Risk score (normalized)
            ],
            'categorical_features': {
                'loan_type': loan_type,
                'risk_category': risk_level.lower().replace(' ', '_'),
                'term_category': 'short' if years <= 5 else 'medium' if years <= 15 else 'long',
                'amount_category': 'small' if principal < 50000 else 'medium' if principal < 200000 else 'large'
            }
        }

        # Compile comprehensive analysis
        analysis = {
            'success': True,
            'loan_info': {
                'name': loan_name,
                'type': loan_type,
                'principal': principal,
                'rate': rate,
                'years': years,
                'extra_payment': extra_payment
            },
            'basic_metrics': {
                'monthly_payment': round(monthly_payment, 2),
                'total_payments': actual_payments,
                'total_interest': round(total_interest, 2),
                'total_cost': round(total_cost, 2),
                'interest_percentage': round((total_interest / principal) * 100, 2)
            },
            'extra_payment_impact': {
                'savings': round(extra_payment_savings, 2),
                'months_saved': int(months_saved),
                'years_saved': round(years_saved, 1),
                'efficiency_ratio': round(efficiency_ratio, 2)
            },
            'risk_assessment': {
                'score': round(risk_score, 1),
                'level': risk_level,
                'color': risk_color,
                'debt_to_income': round(debt_to_income_ratio, 1),
                'payment_to_income': round(payment_to_income_ratio, 1),
                'factors': risk_factors
            },
            'advanced_analytics': {
                'crossover_month': int(crossover_month),
                'interest_trend': 'decreasing' if interest_trend < -5 else 'stable',
                'payment_schedule_stats': {
                    'avg_interest': round(df['interest'].mean(), 2),
                    'avg_principal': round(df['principal'].mean(), 2),
                    'max_interest': round(df['interest'].max(), 2),
                    'min_balance': round(df['remaining_balance'].min(), 2)
                }
            },
            'ml_features': loan_embedding,
            'schedule_summary': {
                'first_payment': payment_data[0] if payment_data else None,
                'last_payment': payment_data[-1] if payment_data else None,
                'midpoint_payment': payment_data[len(payment_data)//2] if payment_data else None,
                'total_records': len(payment_data)
            },
            'recommendations': generate_recommendations(risk_score, extra_payment, rate, years)
        }

        return analysis

    except Exception as e:
        return {
            'success': False,
            'error': f'Calculation error: {str(e)}',
            'error_type': type(e).__name__
        }


def generate_recommendations(risk_score, extra_payment, rate, years):
    """
    Generate personalized recommendations based on loan analysis

    Args:
        risk_score (float): Calculated risk score
        extra_payment (float): Current extra payment amount
        rate (float): Interest rate
        years (int): Loan term

    Returns:
        list: List of recommendation strings
    """
    recommendations = []

    if risk_score > 40:
        recommendations.append("⚠️ Consider refinancing to reduce risk factors")
        recommendations.append("💡 Look for ways to increase down payment")

    if extra_payment == 0 and rate > 4:
        recommendations.append("💰 Consider making extra principal payments to save on interest")

    if years > 20:
        recommendations.append("📅 Consider a shorter loan term to save on total interest")

    if rate > 6:
        recommendations.append("🔍 Shop around for better interest rates")

    if extra_payment > 0:
        recommendations.append("✅ Excellent! Extra payments will save significant interest")

    if not recommendations:
        recommendations.append("✅ This appears to be a well-structured loan")

    return recommendations


def calculate_loan_comparison(loans_data, js_context=None):
    """
    Compare multiple loan scenarios

    Args:
        loans_data (list): List of loan data dictionaries
        js_context (dict): Optional JavaScript context

    Returns:
        dict: Comparison analysis between loans
    """
    try:
        if not isinstance(loans_data, list) or len(loans_data) < 2:
            return {
                'success': False,
                'error': 'At least 2 loans required for comparison'
            }

        loan_analyses = []
        for i, loan in enumerate(loans_data):
            analysis = analyze_custom_loan(loan, js_context)
            if analysis.get('success'):
                loan_analyses.append({
                    'index': i,
                    'name': loan.get('name', f'Loan {i+1}'),
                    'analysis': analysis
                })

        if len(loan_analyses) < 2:
            return {
                'success': False,
                'error': 'Could not analyze enough loans for comparison'
            }

        # Find best and worst loans by different criteria
        best_total_cost = min(loan_analyses, key=lambda x: x['analysis']['basic_metrics']['total_cost'])
        best_monthly = min(loan_analyses, key=lambda x: x['analysis']['basic_metrics']['monthly_payment'])
        lowest_risk = min(loan_analyses, key=lambda x: x['analysis']['risk_assessment']['score'])

        comparison = {
            'success': True,
            'loan_count': len(loan_analyses),
            'best_options': {
                'lowest_total_cost': {
                    'name': best_total_cost['name'],
                    'total_cost': best_total_cost['analysis']['basic_metrics']['total_cost']
                },
                'lowest_monthly_payment': {
                    'name': best_monthly['name'],
                    'monthly_payment': best_monthly['analysis']['basic_metrics']['monthly_payment']
                },
                'lowest_risk': {
                    'name': lowest_risk['name'],
                    'risk_score': lowest_risk['analysis']['risk_assessment']['score']
                }
            },
            'summary_stats': {
                'avg_total_cost': round(sum(l['analysis']['basic_metrics']['total_cost'] for l in loan_analyses) / len(loan_analyses), 2),
                'avg_monthly': round(sum(l['analysis']['basic_metrics']['monthly_payment'] for l in loan_analyses) / len(loan_analyses), 2),
                'avg_risk': round(sum(l['analysis']['risk_assessment']['score'] for l in loan_analyses) / len(loan_analyses), 1)
            },
            'detailed_analyses': loan_analyses
        }

        return comparison

    except Exception as e:
        return {
            'success': False,
            'error': f'Comparison error: {str(e)}'
        }


def validate_loan_parameters(loan_data):
    """
    Validate loan parameters before processing

    Args:
        loan_data (dict): Loan parameters to validate

    Returns:
        dict: Validation result with success flag and any errors
    """
    errors = []

    required_fields = ['principal', 'rate', 'years']
    for field in required_fields:
        if field not in loan_data or loan_data[field] is None or loan_data[field] == '':
            errors.append(f'Missing required field: {field}')

    try:
        principal = float(loan_data.get('principal', 0))
        if principal <= 0:
            errors.append('Principal must be greater than 0')
        elif principal > 10000000:
            errors.append('Principal amount is unrealistically high')
    except (ValueError, TypeError):
        errors.append('Principal must be a valid number')

    try:
        rate = float(loan_data.get('rate', 0))
        if rate < 0:
            errors.append('Interest rate cannot be negative')
        elif rate > 50:
            errors.append('Interest rate is unrealistically high')
    except (ValueError, TypeError):
        errors.append('Interest rate must be a valid number')

    try:
        years = int(loan_data.get('years', 0))
        if years <= 0:
            errors.append('Loan term must be greater than 0')
        elif years > 50:
            errors.append('Loan term is unrealistically long')
    except (ValueError, TypeError):
        errors.append('Loan term must be a valid whole number')

    return {
        'success': len(errors) == 0,
        'errors': errors
    }