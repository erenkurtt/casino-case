"use client";

import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Grid, Select, Table, Tag } from "antd";
import { useRouter } from "next/navigation";
import {
    getBetOptions,
    getMe,
    getSpinHistory,
    spinSlot,
} from "../../api/apiCalls";
import { getAccessToken } from "../../utils/authStorage";
import { emitBalanceUpdated } from "../../utils/appEvents";
import type { SpinHistoryResponse, SpinResponse, User } from "../../types/api";
import Loading from "../utils/Loading";
import styles from "../../styles/spins/spins.module.scss";
import BalanceConverter from "../currency/BalanceConverter";

const SLOT_SYMBOLS = ["apple", "banana", "cherry", "lemon"] as const;

type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

const { useBreakpoint } = Grid;

const symbolImages: Record<SlotSymbol, string> = {
    apple: "/slot-symbols/apple.svg",
    banana: "/slot-symbols/banana.svg",
    cherry: "/slot-symbols/cherry.svg",
    lemon: "/slot-symbols/lemon.svg",
};

function getRandomSymbol(): SlotSymbol {
    return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
}

function isSlotSymbol(value: string): value is SlotSymbol {
    return SLOT_SYMBOLS.includes(value as SlotSymbol);
}

const Slot: React.FC = () => {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [user, setUser] = useState<User | null>(null);
    const [betOptions, setBetOptions] = useState<number[]>([]);
    const [selectedBet, setSelectedBet] = useState<number>(1);
    const [spinResult, setSpinResult] = useState<SpinResponse | null>(null);
    const [history, setHistory] = useState<SpinHistoryResponse["data"]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [spinning, setSpinning] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [displayReels, setDisplayReels] = useState<string[]>([
        "cherry",
        "lemon",
        "banana",
    ]);

    const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const loadInitialData = async () => {
        try {
            setError("");
            setLoading(true);

            const token = getAccessToken();

            if (!token) {
                router.push("/login");
                return;
            }

            const [meResponse, betOptionsResponse, historyResponse] =
                await Promise.all([getMe(), getBetOptions(), getSpinHistory(1, 10)]);

            setUser(meResponse);
            setBetOptions(betOptionsResponse.options);
            setSelectedBet(betOptionsResponse.options[1] ?? betOptionsResponse.options[0]);
            setHistory(historyResponse.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load slot data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const handleSpin = async () => {
        try {
            setError("");
            setSpinning(true);
            setSpinResult(null);

            const animationStartTime = Date.now();
            const minimumAnimationMs = 900;

            spinIntervalRef.current = setInterval(() => {
                setDisplayReels([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
            }, 90);

            const response = await spinSlot(selectedBet);

            const elapsedTime = Date.now() - animationStartTime;
            const remainingTime = Math.max(minimumAnimationMs - elapsedTime, 0);

            await new Promise((resolve) => setTimeout(resolve, remainingTime));

            if (spinIntervalRef.current) {
                clearInterval(spinIntervalRef.current);
                spinIntervalRef.current = null;
            }

            setSpinResult(response);
            setDisplayReels(response.reels);
            emitBalanceUpdated(response.updatedBalance);

            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        balance: response.updatedBalance,
                    }
                    : prev,
            );

            const historyResponse = await getSpinHistory(1, 10);
            setHistory(historyResponse.data);
        } catch (err) {
            if (spinIntervalRef.current) {
                clearInterval(spinIntervalRef.current);
                spinIntervalRef.current = null;
            }

            setError(err instanceof Error ? err.message : "Spin failed");
        } finally {
            setSpinning(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className={styles.slotPage}>
            {error && (
                <Alert
                    type="error"
                    message={error}
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            <Card title="Slot Machine" className={styles.slotCard}>
                <div className={styles.slotHeader}>
                    <div className={styles.balanceBox}>
                        <h1>
                            Balance:{" "}
                            <Tag color="blue" style={{ fontSize: 18, padding: "4px 10px" }}>
                                {user?.balance ?? 0} coins
                            </Tag>
                        </h1>

                        <p>Choose your bet amount and spin the reels.</p>
                    </div>

                    <div className={styles.controls}>
                        <Select
                            value={selectedBet}
                            style={{ width: 140 }}
                            onChange={(value: number) => setSelectedBet(value)}
                            options={betOptions.map((option) => ({
                                value: option,
                                label: `${option} coin`,
                            }))}
                        />

                        <Button
                            type="primary"
                            size="large"
                            loading={spinning}
                            onClick={handleSpin}
                            disabled={!user || user.balance < selectedBet}
                        >
                            Spin
                        </Button>
                    </div>
                </div>
                {user && <BalanceConverter balance={user.balance} baseCurrency="EUR" />}
                {user && user.balance < selectedBet && (
                    <Alert
                        type="warning"
                        message="Insufficient balance for selected bet amount"
                        showIcon
                        style={{ marginTop: 24 }}
                    />
                )}

                <div className={styles.reels}>
                    {displayReels.map((reel, index) => {
                        const imageSrc = isSlotSymbol(reel) ? symbolImages[reel] : null;

                        return (
                            <div
                                key={`${reel}-${index}`}
                                className={`${styles.reel} ${spinning ? styles.spinning : ""}`}
                            >
                                {imageSrc ? (
                                    <img src={imageSrc} alt={reel} className={styles.reelImage} />
                                ) : (
                                    <span>?</span>
                                )}

                                <span className={styles.reelLabel}>{reel}</span>
                            </div>
                        );
                    })}
                </div>

                {spinResult && (
                    <div className={styles.resultBox}>
                        <Tag
                            color={spinResult.amountWonLost >= 0 ? "green" : "red"}
                            style={{ fontSize: 16, padding: "6px 12px" }}
                        >
                            {spinResult.amountWonLost >= 0 ? "Won" : "Lost"}{" "}
                            {Math.abs(spinResult.amountWonLost)} coins
                        </Tag>

                        <p className={styles.resultMeta}>
                            Bet: {spinResult.betAmount} | Win: {spinResult.winAmount} |
                            Updated Balance: {spinResult.updatedBalance}
                        </p>
                    </div>
                )}
            </Card>

            <Card title="Spin History" className={styles.historyCard}>
                {isMobile ? (
                    <div className={styles.historyMobileList}>
                        {history.length === 0 ? (
                            <div className={styles.emptyHistory}>No spin history yet.</div>
                        ) : (
                            history.map((item) => (
                                <div key={item.id} className={styles.historyMobileCard}>
                                    <div className={styles.historyMobileHeader}>
                                        <div>
                                            <span className={styles.historyLabel}>Reels</span>
                                            <strong>{item.reels.join(" - ")}</strong>
                                        </div>

                                        <Tag color={item.amountWonLost >= 0 ? "green" : "red"}>
                                            {item.amountWonLost >= 0 ? "+" : ""}
                                            {item.amountWonLost}
                                        </Tag>
                                    </div>

                                    <div className={styles.historyGrid}>
                                        <div>
                                            <span>Bet</span>
                                            <strong>{item.betAmount}</strong>
                                        </div>

                                        <div>
                                            <span>Win</span>
                                            <strong>{item.winAmount}</strong>
                                        </div>

                                        <div>
                                            <span>Balance</span>
                                            <strong>{item.balanceAfter}</strong>
                                        </div>

                                        <div>
                                            <span>Date</span>
                                            <strong>{new Date(item.spunAt).toLocaleDateString()}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <Table
                        rowKey="id"
                        dataSource={history}
                        pagination={false}
                        scroll={{ x: 720 }}
                        columns={[
                            {
                                title: "Reels",
                                dataIndex: "reels",
                                render: (reels: string[]) => reels.join(" - "),
                            },
                            {
                                title: "Bet",
                                dataIndex: "betAmount",
                            },
                            {
                                title: "Win",
                                dataIndex: "winAmount",
                            },
                            {
                                title: "Net",
                                dataIndex: "amountWonLost",
                                render: (value: number) => (
                                    <Tag color={value >= 0 ? "green" : "red"}>
                                        {value >= 0 ? "+" : ""}
                                        {value}
                                    </Tag>
                                ),
                            },
                            {
                                title: "Balance After",
                                dataIndex: "balanceAfter",
                            },
                            {
                                title: "Date",
                                dataIndex: "spunAt",
                                render: (value: string) => new Date(value).toLocaleString(),
                            },
                        ]}
                    />
                )}
            </Card>
        </div>
    );
};

export default Slot;