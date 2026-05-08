import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Plotly: any;
  }
}

interface MathPlotProps {
  data: any[];
  layout?: any;
}

export default function MathPlot({ data, layout }: MathPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.Plotly) {
      const defaultLayout = {
        autosize: true,
        margin: { l: 40, r: 20, t: 30, b: 40 },
        xaxis: { gridcolor: '#eee', zerolinecolor: '#999' },
        yaxis: { gridcolor: '#eee', zerolinecolor: '#999' },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        ...layout
      };

      window.Plotly.newPlot(containerRef.current, data, defaultLayout, { responsive: true });
    }
  }, [data, layout]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />;
}
