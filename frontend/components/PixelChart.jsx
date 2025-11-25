"use client";
import { useEffect, useRef } from "react";

/**
 * props.data: [{ t: unixSec, rate: number }, ...] 按时间升序
 */
export default function PixelChart({ data = [], height = 260 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = "#06090e";
    ctx.fillRect(0, 0, width, height);

    if (!data.length) return;

    // 辅助：像素网格
    const grid = 6; // 像素网格尺寸
    ctx.strokeStyle = "rgba(80, 255, 120, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += grid) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(width, y + 0.5); ctx.stroke();
    }

    // 归一化
    const minT = data[0].t, maxT = data[data.length - 1].t;
    const rates = data.map(d => d.rate);
    const minR = Math.min(...rates), maxR = Math.max(...rates);
    const pad = 10;
    const fx = (t) => pad + (t - minT) / Math.max(1, (maxT - minT)) * (width - pad*2);
    const fy = (r) => {
      const y = pad + (1 - (r - minR) / Math.max(1e-12, (maxR - minR))) * (height - pad*2);
      // 像素吸附
      return Math.round(y / grid) * grid;
    };

    // 荧光像素线（两层描边模拟发光）
    ctx.lineJoin = "round";
    const drawLine = (alpha, lw) => {
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = Math.round(fx(d.t) / grid) * grid;
        const y = fy(d.rate);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = `rgba(120, 255, 120, ${alpha})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    };
    drawLine(0.18, 10);
    drawLine(0.9, 2);

    // 左上角数字
    ctx.fillStyle = "#a6ffb0";
    ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    const last = data[data.length-1].rate;
    ctx.fillText(`Rate SGD/HKD: ${last.toFixed(6)}`, 12, 20);
  }, [data, height]);

  return (
    <div className="w-full rounded-2xl border border-lime-400/20 bg-black/60 p-3 shadow-[0_0_40px_rgba(70,255,130,0.12)]">
      <canvas ref={ref} style={{ width: "100%", height }} />
    </div>
  );
}
