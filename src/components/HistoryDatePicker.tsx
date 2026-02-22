"use client";

import { Input } from "@/components/ui/input";
import type { ChangeEvent } from "react";

interface HistoryDatePickerProps {
    defaultValue: string;
}

export function HistoryDatePicker({ defaultValue }: HistoryDatePickerProps) {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const newDate = e.target.value;
        if (newDate) window.location.href = `/dashboard/history?date=${newDate}`;
    }

    return (
        <Input
            type="date"
            defaultValue={defaultValue}
            onChange={handleChange}
            className="w-48 h-12 rounded-2xl bg-card/50 border-none shadow-xl text-center font-bold"
        />
    );
}
