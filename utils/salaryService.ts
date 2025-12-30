// utils/salaryService.ts
import { SalaryRule, CTCBreakdown } from '../types';

// --- CONSTANTS ---

export const initialBreakdown: CTCBreakdown = {
  monthly: {
    basic: 0, hra: 0, conveyance: 0, medical: 0, statutoryBonus: 0, specialAllowance: 0, gross: 0,
    employeePF: 0, employeeESI: 0, totalDeductions: 0,
    netSalary: 0,
    employerPF: 0, employerESI: 0, ctc: 0
  },
  annual: {
    basic: 0, hra: 0, conveyance: 0, medical: 0, statutoryBonus: 0, specialAllowance: 0, gross: 0,
    employeePF: 0, employeeESI: 0, totalDeductions: 0,
    netSalary: 0,
    employerPF: 0, employerESI: 0, ctc: 0
  }
};

const DEFAULT_RULE: SalaryRule = {
    designation: 'Default',
    basic: { percentage: 40, of: 'gross' },
    hra: { percentage: 50, of: 'basic' },
    conveyance: 0,
    medical: 0,
    statutoryBonus: 0,
};

// --- CALCULATION LOGIC ---

export const calculateBreakdownFromRule = (annualCTC: number, rule: SalaryRule | undefined | null): CTCBreakdown => {
    if (isNaN(annualCTC) || annualCTC <= 0) {
        return initialBreakdown;
    }

    const effectiveRule = rule || DEFAULT_RULE;
    const annual: Record<string, number> = { ctc: annualCTC };

    // FIX: Defensively parse rule values to ensure they are numbers, preventing calculation errors.
    const basicPercentageOfGross = (parseFloat(String(effectiveRule.basic.percentage)) || 0) / 100;
    const hraPercentageOfBasic = (parseFloat(String(effectiveRule.hra.percentage)) || 0) / 100;
    const conveyance = parseFloat(String(effectiveRule.conveyance)) || 0;
    const medical = parseFloat(String(effectiveRule.medical)) || 0;
    const statutoryBonus = parseFloat(String(effectiveRule.statutoryBonus)) || 0;

    // Iterative approach to find Gross, accounting for ESI threshold
    let estimatedAnnualGross = annualCTC * 0.9; // Initial guess
    let iterationCount = 0;
    const MAX_ITERATIONS = 100;
    const CONVERGENCE_THRESHOLD = 0.5; // less than 50 paise difference

    while (iterationCount < MAX_ITERATIONS) {
        const isEsiApplicable = estimatedAnnualGross <= 21000 * 12; // ESI threshold is monthly gross 21000
        const employerPFMultiplier = 0.12 * basicPercentageOfGross;
        const employerESIMultiplier = isEsiApplicable ? 0.0325 : 0;
        
        const calculatedAnnualGross = annualCTC / (1 + employerPFMultiplier + employerESIMultiplier);
        
        if (Math.abs(estimatedAnnualGross - calculatedAnnualGross) < CONVERGENCE_THRESHOLD) {
            estimatedAnnualGross = calculatedAnnualGross; // Converged
            break;
        }
        estimatedAnnualGross = calculatedAnnualGross; // Update estimate
        iterationCount++;
    }

    annual.gross = estimatedAnnualGross;
    
    // Earnings
    annual.basic = annual.gross * basicPercentageOfGross;
    annual.hra = annual.basic * hraPercentageOfBasic;
    annual.conveyance = conveyance * 12;
    annual.medical = medical * 12;
    annual.statutoryBonus = statutoryBonus * 12;
    
    annual.specialAllowance = Math.max(0, annual.gross - annual.basic - annual.hra - annual.conveyance - annual.medical - annual.statutoryBonus);
    
    // Employee Deductions (No Professional Tax as per image)
    const isEsiApplicableForDeductions = annual.gross / 12 <= 21000;
    annual.employeePF = annual.basic * 0.12; // 12%
    annual.employeeESI = isEsiApplicableForDeductions ? (annual.gross * 0.0075) : 0; // 0.75%
    
    annual.totalDeductions = annual.employeePF + annual.employeeESI;
    annual.netSalary = annual.gross - annual.totalDeductions;

    // Employer Contributions
    annual.employerPF = annual.basic * 0.12;
    annual.employerESI = isEsiApplicableForDeductions ? (annual.gross * 0.0325) : 0;
    
    // Recalculate CTC based on actual derived gross and employer contributions, ensuring it matches initial input (minor rounding differences possible)
    annual.ctc = annual.gross + annual.employerPF + annual.employerESI;


    const monthly = Object.fromEntries(
        Object.entries(annual).map(([key, value]) => [key, value / 12])
    ) as Record<string, number>;

    return { annual, monthly };
};

export const calculateCTCFromNetSalary = (monthlyNet: number, rule: SalaryRule | null): CTCBreakdown => {
    if (isNaN(monthlyNet) || monthlyNet <= 0) {
        return initialBreakdown;
    }

    const effectiveRule = rule || DEFAULT_RULE;

    // Fixed monthly allowances are included in gross but are not percentages
    const conveyance = parseFloat(String(effectiveRule.conveyance)) || 0;
    const medical = parseFloat(String(effectiveRule.medical)) || 0;
    const statutoryBonus = parseFloat(String(effectiveRule.statutoryBonus)) || 0;
    const fixedMonthlyAllowances = conveyance + medical + statutoryBonus;

    const basicPercentageOfGross = (parseFloat(String(effectiveRule.basic.percentage)) || 0) / 100;
    const hraPercentageOfBasic = (parseFloat(String(effectiveRule.hra.percentage)) || 0) / 100;

    // Coefficients for deductions related to gross/basic
    const pfRate = 0.12; // 12% of basic for employee and employer
    const esiEmployeeRate = 0.0075; // 0.75% of gross
    const esiEmployerRate = 0.0325; // 3.25% of gross
    const ESI_THRESHOLD = 21000; // Monthly gross threshold for ESI

    let monthlyGross = monthlyNet * 1.25; // Initial guess for gross
    const MAX_ITERATIONS = 100;
    const CONVERGENCE_THRESHOLD = 0.01; // 1 paisa difference

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const isEsiApplicable = monthlyGross <= ESI_THRESHOLD;

        const basic = monthlyGross * basicPercentageOfGross;
        const hra = basic * hraPercentageOfBasic;
        // Special Allowance is the balancing figure to reach gross after other fixed and percentage earnings
        const specialAllowance = Math.max(0, monthlyGross - basic - hra - fixedMonthlyAllowances);

        const employeePF = basic * pfRate;
        const employeeESI = isEsiApplicable ? (monthlyGross * esiEmployeeRate) : 0;
        
        const totalDeductions = employeePF + employeeESI;
        const calculatedNet = monthlyGross - totalDeductions;

        if (Math.abs(calculatedNet - monthlyNet) < CONVERGENCE_THRESHOLD) {
            break; // Converged
        }

        // Adjust monthlyGross for the next iteration
        monthlyGross = monthlyGross + (monthlyNet - calculatedNet) * 0.8; // Adjust with a dampening factor
        if (monthlyGross < 0) monthlyGross = 0; // Prevent negative gross
    }
    
    // Final Calculation with converged monthlyGross
    const monthly: Record<string, number> = {};
    monthly.gross = monthlyGross;
    
    monthly.basic = monthly.gross * basicPercentageOfGross;
    monthly.hra = monthly.basic * hraPercentageOfBasic;
    monthly.conveyance = conveyance;
    monthly.medical = medical;
    monthly.statutoryBonus = statutoryBonus;
    monthly.specialAllowance = Math.max(0, monthly.gross - monthly.basic - monthly.hra - monthly.conveyance - monthly.medical - monthly.statutoryBonus);

    const isEsiApplicableFinal = monthly.gross <= ESI_THRESHOLD;
    monthly.employeePF = monthly.basic * pfRate;
    monthly.employeeESI = isEsiApplicableFinal ? (monthly.gross * esiEmployeeRate) : 0;
    monthly.totalDeductions = monthly.employeePF + monthly.employeeESI;
    monthly.netSalary = monthly.gross - monthly.totalDeductions;
    
    monthly.employerPF = monthly.basic * pfRate;
    monthly.employerESI = isEsiApplicableFinal ? (monthly.gross * esiEmployerRate) : 0;
    
    monthly.ctc = monthly.gross + monthly.employerPF + monthly.employerESI;

    const annual = Object.fromEntries(
        Object.entries(monthly).map(([key, value]) => [key, value * 12])
    ) as Record<string, number>;
    
    return { monthly, annual };
};
