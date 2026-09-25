/**
 * Helpers for Gran Fish price list calculations and standard weight conversions.
 *
 * Regra de Negócio:
 * - Peso Padrão: quando a descrição contiver os volumes 400, 600 e 800 gramas, converter.
 * - Quando não contiver, não citar o preço por pacote, deixando apenas com o sinal de "-".
 */

export interface PricingResult {
  pricePerKg: number | null;
  formattedPricePerKg: string;
  isStandardWeight: boolean;
  standardGrams: number | null; // 400, 600 or 800
  weightInKg: number | null; // 0.40, 0.60, or 0.80
  packagePrice: number | null;
  formattedPackagePrice: string;
  calculationFormula: string;
}

/**
 * Detects if a description contains 400, 600, or 800 grams.
 * Returns 400, 600, 800 or null.
 */
export function getStandardGramsFromDescription(description: string | undefined): number | null {
  if (!description) return null;
  const match = description.match(/(?:^|[^\d])(400|600|800)(?!\d)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val === 400 || val === 600 || val === 800) {
      return val;
    }
  }
  return null;
}

export interface BoxWeightInfo {
  rawDisplay: string;
  tableLabel: string;
  displayLabel: string;
  shortLabel: string;
  isVariable: boolean;
}

export interface ParsedWeightInfo {
  weight: number | null;
  isStandard: boolean;
  isVariable: boolean;
  standardGrams: number | null;
  rawDisplay: string;
  displayLabel: string;
  tableLabel: string;
  shortLabel: string;
  boxWeightInfo: BoxWeightInfo;
}

/**
 * Formats a box weight (peso caixa).
 * For variable products, adds the approximate symbol (~) and average label (média).
 * Ex: "21 KG" -> tableLabel: "~ 21 KG", displayLabel: "~ 21 KG (média)"
 * For standard/fixed products:
 * Ex: "10 KG" -> tableLabel: "10 KG", displayLabel: "10 KG (Padrão)"
 */
export function formatBoxWeight(
  boxWeightStr: string | undefined,
  isVariable: boolean
): BoxWeightInfo {
  if (!boxWeightStr || boxWeightStr.trim() === '' || boxWeightStr.trim() === '-' || boxWeightStr.trim() === '#N/D') {
    return {
      rawDisplay: '-',
      tableLabel: '-',
      displayLabel: '-',
      shortLabel: '-',
      isVariable
    };
  }

  const clean = boxWeightStr.trim();
  // Strip existing tildes if already present
  const baseWeight = clean.replace(/^[~≈]\s*/, '');

  if (isVariable) {
    return {
      rawDisplay: `~ ${baseWeight}`,
      tableLabel: `~ ${baseWeight}`,
      displayLabel: `~ ${baseWeight} (média)`,
      shortLabel: `~ ${baseWeight}`,
      isVariable: true
    };
  }

  return {
    rawDisplay: baseWeight,
    tableLabel: baseWeight,
    displayLabel: `${baseWeight} (Padrão)`,
    shortLabel: baseWeight,
    isVariable: false
  };
}

/**
 * Formats a variable weight with approximate sign (≈) and average label (média).
 * Ex: "1,36" -> "≈ 1,36 kg (média)"
 */
export function formatVariableWeight(pctWeightStr: string | undefined): {
  displayLabel: string;
  tableLabel: string;
  shortLabel: string;
} {
  if (!pctWeightStr || pctWeightStr.trim() === '' || pctWeightStr.trim() === '-' || pctWeightStr.trim() === '#N/D') {
    return {
      displayLabel: 'Variável (sob pesagem)',
      tableLabel: 'Variável',
      shortLabel: 'Variável'
    };
  }

  const clean = pctWeightStr.trim();
  const numMatch = clean.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    const formattedNum = val.toFixed(2).replace('.', ',');
    return {
      displayLabel: `~ ${formattedNum} kg (média)`,
      tableLabel: `~ ${formattedNum} kg`,
      shortLabel: `~ ${formattedNum} kg`
    };
  }

  return {
    displayLabel: `~ ${clean}`,
    tableLabel: `~ ${clean}`,
    shortLabel: `~ ${clean}`
  };
}

export function parseStandardWeight(
  pctWeightStr: string | undefined,
  description?: string | undefined,
  boxWeightStr?: string | undefined
): ParsedWeightInfo {
  const grams = getStandardGramsFromDescription(description);
  const isStandard = grams !== null;
  const isVariable = !isStandard;
  const boxWeightInfo = formatBoxWeight(boxWeightStr, isVariable);

  if (isStandard && grams !== null) {
    const kg = grams / 1000;
    const formattedKg = `${kg.toFixed(2).replace('.', ',')} kg`;
    return {
      weight: kg,
      isStandard: true,
      isVariable: false,
      standardGrams: grams,
      rawDisplay: pctWeightStr || formattedKg,
      displayLabel: `${formattedKg} (${grams}g Padrão)`,
      tableLabel: formattedKg,
      shortLabel: formattedKg,
      boxWeightInfo
    };
  }

  const variableFormat = formatVariableWeight(pctWeightStr);

  return {
    weight: null,
    isStandard: false,
    isVariable: true,
    standardGrams: null,
    rawDisplay: variableFormat.tableLabel,
    displayLabel: variableFormat.displayLabel,
    tableLabel: variableFormat.tableLabel,
    shortLabel: variableFormat.shortLabel,
    boxWeightInfo
  };
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function calculateItemPricing(
  pricePerKg: number | undefined | null,
  pctWeightStr?: string | undefined,
  description?: string | undefined
): PricingResult {
  const grams = getStandardGramsFromDescription(description);
  const isStandard = grams !== null;
  const weightInKg = grams !== null ? grams / 1000 : null;

  // Quando não contiver 400, 600 ou 800g, não citar preço por pct, deixar com "-"
  if (!isStandard || weightInKg === null) {
    const validPricePerKg =
      pricePerKg !== undefined && pricePerKg !== null && !isNaN(pricePerKg) && pricePerKg > 0
        ? Number(pricePerKg)
        : null;

    return {
      pricePerKg: validPricePerKg,
      formattedPricePerKg: validPricePerKg !== null ? formatCurrency(validPricePerKg) : '-',
      isStandardWeight: false,
      standardGrams: null,
      weightInKg: null,
      packagePrice: null,
      formattedPackagePrice: '-',
      calculationFormula: 'Não aplicável (peso não padrão)'
    };
  }

  // Contém 400, 600 ou 800g
  const hasPrice = pricePerKg !== undefined && pricePerKg !== null && !isNaN(pricePerKg) && pricePerKg > 0;
  if (!hasPrice) {
    return {
      pricePerKg: null,
      formattedPricePerKg: '-',
      isStandardWeight: true,
      standardGrams: grams,
      weightInKg,
      packagePrice: null,
      formattedPackagePrice: 'A definir',
      calculationFormula: `Padrão ${grams}g (${weightInKg.toFixed(2).replace('.', ',')} kg) - Preço/kg a definir`
    };
  }

  const validPricePerKg = Number(pricePerKg);
  const formattedPricePerKg = formatCurrency(validPricePerKg);
  const packagePrice = validPricePerKg * weightInKg;
  const formattedPackagePrice = formatCurrency(packagePrice);
  const calculationFormula = `${weightInKg.toFixed(2).replace('.', ',')} kg (${grams}g) × ${formattedPricePerKg} = ${formattedPackagePrice}`;

  return {
    pricePerKg: validPricePerKg,
    formattedPricePerKg,
    isStandardWeight: true,
    standardGrams: grams,
    weightInKg,
    packagePrice,
    formattedPackagePrice,
    calculationFormula
  };
}
