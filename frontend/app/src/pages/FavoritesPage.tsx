"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Col, Row, Tag } from "antd";
import { useRouter } from "next/navigation";
import Navigation from "../components/navigation/Navigation";
import Loading from "../components/utils/Loading";
import { getAccessToken } from "../utils/authStorage";
import { getFavorites, removeFavorite } from "../api/apiCalls";
import type { FavoriteGame } from "../types/api";
import styles from "../styles/favorites/favorites.module.scss";

const { Meta } = Card;

const FavoritesPage: React.FC = () => {
    const router = useRouter();

    const [favorites, setFavorites] = useState<FavoriteGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingGameId, setRemovingGameId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const loadFavorites = async () => {
        try {
            setError("");
            setLoading(true);

            const token = getAccessToken();

            if (!token) {
                router.push("/login");
                return;
            }

            const response = await getFavorites(1, 100);
            setFavorites(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load favorites");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFavorites();
    }, []);

    const handleRemoveFavorite = async (gameId: string) => {
        try {
            setError("");
            setRemovingGameId(gameId);

            await removeFavorite(gameId);

            setFavorites((prev) =>
                prev.filter((favorite) => favorite.game.id !== gameId),
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to remove favorite",
            );
        } finally {
            setRemovingGameId(null);
        }
    };

    return (
        <div>
            <Navigation />

            <main className={styles.page}>
                <div className={styles.header}>
                    <h1>Favorite Games</h1>
                    <p>Games you saved to play later.</p>
                </div>

                {error && (
                    <Alert
                        type="error"
                        message={error}
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                {loading ? (
                    <Loading />
                ) : favorites.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h2>No favorite games yet</h2>
                        <p>Go to games and add your favorite ones.</p>

                        <Link href="/">
                            <Button type="primary">Browse Games</Button>
                        </Link>
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {favorites.map((favorite) => (
                            <Col
                                xs={24}
                                sm={12}
                                md={8}
                                lg={6}
                                xl={6}
                                xxl={4}
                                key={favorite.game.id}
                            >
                                <Card
                                    hoverable
                                    cover={
                                        <div className={styles.imageWrapper}>
                                            <img
                                                alt={favorite.game.name}
                                                src={favorite.game.thumbnailUrl || "/no-image.jpg"}
                                                className={styles.cardImage}
                                            />
                                        </div>
                                    }
                                >
                                    <Meta
                                        title={favorite.game.name}
                                        description={favorite.game.providerName}
                                    />

                                    <div className={styles.cardActions}>
                                        <Tag color="blue">{favorite.game.gameType?.name}</Tag>

                                        <Button
                                            danger
                                            size="small"
                                            loading={removingGameId === favorite.game.id}
                                            onClick={() => handleRemoveFavorite(favorite.game.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </main>
        </div>
    );
};

export default FavoritesPage;