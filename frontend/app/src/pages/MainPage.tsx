"use client";
import React from "react";
import GameList from "../components/gameList/GameList";
import PaginationSide from "../components/pagination/PaginationSide";
import SearchBox from "../components/search/SearchBox";
import Navigation from "../components/navigation/Navigation";
import { Suspense } from 'react';


const MainPage: React.FC = () => {
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <Navigation />
                <SearchBox />
                <GameList />
                <PaginationSide />
            </Suspense>
        </div>
    )
};

export default MainPage;