type LoanComparisonResult = {
  grossInterestCost: number
  interestCostAfterTax: number
  netDividend: number
  totalTermFee: number
  netCostAfterDividend: number
}

/**
 * Beregner netto lånekostnad etter skatt og utbytte, inkludert termingebyr
 * @param loanAmount Lånebeløp i NOK
 * @param effectiveRate Effektiv rente (f.eks. 5.37 for 5,37%)
 * @param annualDividend Kundeutbytte i NOK per år
 * @param termFeePerMonth Termingebyr per måned (kr)
 * @param interestDeductionRate Skattefradrag for rente (default 22%)
 * @param dividendTaxRate Effektiv skatt på utbytte (default 37.84%)
 */
export function calculateNetLoanCost(
  loanAmount: number,
  effectiveRate: number,
  annualDividend: number,
  termFeePerMonth: number,
  interestDeductionRate: number = 0.22,
  dividendTaxRate: number = 0.22
): LoanComparisonResult {
  const grossInterestCost = loanAmount * (effectiveRate / 100)
 // console.log(`Beregnet brutto rentekostnad: ${grossInterestCost} kr`)
  const interestCostAfterTax = grossInterestCost * (1 - interestDeductionRate)
//console.log(`Beregnet rentekostnad etter skatt: ${interestCostAfterTax} kr`)
  const netDividend = annualDividend * (1 - dividendTaxRate)
 // console.log(`Beregnet netto utbytte etter skatt: ${netDividend} kr`)

  const totalTermFee = termFeePerMonth * 12
 // console.log(`Beregnet totale termingebyr for ett år: ${totalTermFee} kr`)

  const netCostAfterDividend = interestCostAfterTax  - netDividend
//  console.log(`Beregnet netto lånekostnad etter utbytte: ${netCostAfterDividend} kr`)

  return {
    grossInterestCost,
    interestCostAfterTax,
    netDividend,
    totalTermFee,
    netCostAfterDividend,
  }
}
