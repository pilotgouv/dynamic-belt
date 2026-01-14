"use client";
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ChartProps {
    data: any[];
    type: 'area' | 'bar';
    dataKey1: string;
    dataKey2?: string;
    color1?: string;
    color2?: string;
    height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(5, 5, 5, 0.9)',
                border: '1px solid var(--border-subtle)',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.stroke || entry.fill, fontSize: '14px', fontWeight: '600' }}>
                        {entry.name}: {entry.value.toLocaleString()} €
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function BusinessChart({
    data,
    type,
    dataKey1,
    dataKey2,
    color1 = "#D4AF37",
    color2 = "#3b82f6",
    height = 300
}: ChartProps) {

    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer>
                {type === 'area' ? (
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`color${dataKey1}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color1} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color1} stopOpacity={0} />
                            </linearGradient>
                            {dataKey2 && (
                                <linearGradient id={`color${dataKey2}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color2} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color2} stopOpacity={0} />
                                </linearGradient>
                            )}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey={dataKey1} stroke={color1} fill={`url(#color${dataKey1})`} strokeWidth={2} />
                        {dataKey2 && <Area type="monotone" dataKey={dataKey2} stroke={color2} fill={`url(#color${dataKey2})`} strokeWidth={2} />}
                    </AreaChart>
                ) : (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={dataKey1} fill={color1} radius={[4, 4, 0, 0]} />
                        {dataKey2 && <Bar dataKey={dataKey2} fill={color2} radius={[4, 4, 0, 0]} />}
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
