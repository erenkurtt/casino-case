"use client";
import React from "react";
import Slot from "../components/slotspin/Slot";
import Navigation from "../components/navigation/Navigation";
import { Suspense } from 'react';

const SpinPage: React.FC = () => {
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <Navigation />
                <Slot />
            </Suspense>
        </div>
    )
};

export default SpinPage;