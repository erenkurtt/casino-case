"use client";

import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Row, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { GameListItem } from "./interface";
import {
    addFavorite,
    getFavorites,
    getGameList,
    removeFavorite,
} from "../../api/apiCalls";
import { getAccessToken } from "../../utils/authStorage";
import styles from "../../styles/gamelist/gameList.module.scss";
import { RootState, AppDispatch } from "../../store/index";
import { setTotalItems, setTotalPage } from "../../store/gameSlice";
import Loading from "../utils/Loading";

const { Meta } = Card;

const GameList: React.FC = () => {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const [gameItems, setGameItems] = useState<GameListItem[]>();
    const [favoriteGameIds, setFavoriteGameIds] = useState<string[]>([]);
    const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(
        null,
    );
    const [error, setError] = useState<string>("");

    const pageNumb = useSelector((state: RootState) => state.game.page);
    const searchText = useSelector((state: RootState) => state.game.searchText);
    const limit = useSelector((state: RootState) => state.game.limit);

    const isAuthenticated = Boolean(getAccessToken());

    const fetchFavoriteIds = async () => {
        const token = getAccessToken();

        if (!token) {
            setFavoriteGameIds([]);
            return;
        }

        const response = await getFavorites(1, 100);
        setFavoriteGameIds(response.data.map((favorite) => favorite.game.id));
    };

    useEffect(() => {
        const fetchGameList = async () => {
            try {
                setError("");
                setGameItems(undefined);

                const response = await getGameList(pageNumb, searchText, limit);

                setGameItems(response.data);
                dispatch(setTotalPage(response.meta.totalPages));
                dispatch(setTotalItems(response.meta.total));

                await fetchFavoriteIds();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch games");
                setGameItems([]);
            }
        };

        fetchGameList();
    }, [pageNumb, searchText, limit, dispatch]);

    const handleFavoriteClick = async (gameId: string) => {
        try {
            setError("");

            const token = getAccessToken();

            if (!token) {
                router.push("/login");
                return;
            }

            setFavoriteLoadingId(gameId);

            const alreadyFavorite = favoriteGameIds.includes(gameId);

            if (alreadyFavorite) {
                await removeFavorite(gameId);
                setFavoriteGameIds((prev) => prev.filter((id) => id !== gameId));
            } else {
                await addFavorite(gameId);
                setFavoriteGameIds((prev) => [...prev, gameId]);
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update favorite",
            );
        } finally {
            setFavoriteLoadingId(null);
        }
    };

    if (error) {
        return (
            <div className={styles.gameListContainer}>
                <Alert type="error" message={error} showIcon />
            </div>
        );
    }

    return (
        <div className={styles.gameListContainer}>
            <Row gutter={[36, 36]} justify="center">
                {gameItems ? (
                    gameItems.map((item) => {
                        const alreadyFavorite = favoriteGameIds.includes(item.id);

                        return (
                            <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={item.id}>
                                <Card
                                    hoverable
                                    cover={
                                        <div className={styles.imageWrapper}>
                                            <img
                                                alt={item.name}
                                                src={item.thumbnailUrl || "/no-image.jpg"}
                                                className={styles.gameImage}
                                            />
                                        </div>
                                    }
                                    className={styles.gameItem}
                                >
                                    <Meta title={item.name} description={item.providerName} />

                                    <div style={{ marginTop: 16 }}>
                                        <Tag color={item.isActive ? "green" : "red"}>
                                            {item.isActive ? "Active" : "Inactive"}
                                        </Tag>
                                    </div>

                                    <Button
                                        block
                                        type={alreadyFavorite ? "default" : "primary"}
                                        danger={alreadyFavorite}
                                        loading={favoriteLoadingId === item.id}
                                        onClick={() => handleFavoriteClick(item.id)}
                                        style={{ marginTop: 16 }}
                                    >
                                        {!isAuthenticated
                                            ? "Login to Favorite"
                                            : alreadyFavorite
                                                ? "Remove Favorite"
                                                : "Add Favorite"}
                                    </Button>
                                </Card>
                            </Col>
                        );
                    })
                ) : (
                    <Loading />
                )}
            </Row>
        </div>
    );
};

export default GameList;