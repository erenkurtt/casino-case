"use client";

import React, { useEffect, useState } from "react";
import { Alert, Button, Select, Tag } from "antd";
import { getExchangeRates } from "../../api/apiCalls";
import styles from "../../styles/currency/currency.module.scss";

type BalanceConverterProps = {
  balance: number;
  baseCurrency?: string;
};

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "TRY", label: "TRY - Turkish Lira" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "EUR", label: "EUR - Euro" },
];

const currencySymbols: Record<string, string> = {
  USD: "$",
  TRY: "₺",
  GBP: "£",
  EUR: "€",
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

const BalanceConverter: React.FC<BalanceConverterProps> = ({
  balance,
  baseCurrency = "EUR",
}) => {
  const [targetCurrency, setTargetCurrency] = useState("USD");
  const [convertedValue, setConvertedValue] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConvertedValue(null);
    setRate(null);
    setError("");
  }, [balance, targetCurrency]);

  const convertBalance = async () => {
    try {
      setError("");
      setLoading(true);

      const exchangeData = await getExchangeRates(baseCurrency);

      const rates =
        exchangeData.rates ?? exchangeData.conversion_rates ?? {};

      const selectedRate = rates[targetCurrency];

      if (!selectedRate) {
        throw new Error(`Exchange rate not found for ${targetCurrency}`);
      }

      setRate(selectedRate);
      setConvertedValue(balance * selectedRate);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Currency conversion failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.converter}>
      <div className={styles.converterHeader}>
        <div>
          <h3>Currency Conversion</h3>
          <p>
            Display-only conversion. Stored coin balance will not be modified.
          </p>
        </div>

        <Tag color="blue">
          {balance} coins ≈ {currencySymbols[baseCurrency] ?? baseCurrency}
          {balance} {baseCurrency}
        </Tag>
      </div>

      <div className={styles.controls}>
        <Select
          value={targetCurrency}
          style={{ minWidth: 210 }}
          onChange={(value: string) => setTargetCurrency(value)}
          options={CURRENCY_OPTIONS}
        />

        <Button type="primary" onClick={convertBalance} loading={loading}>
          Convert Balance
        </Button>
      </div>

      {convertedValue !== null && (
        <div className={styles.result}>
          <strong>{balance} coins</strong> is approximately{" "}
          <strong>{formatCurrency(convertedValue, targetCurrency)}</strong>
          {rate && (
            <span className={styles.rate}>
              Rate: 1 {baseCurrency} = {rate.toFixed(4)} {targetCurrency}
            </span>
          )}
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
};

export default BalanceConverter;