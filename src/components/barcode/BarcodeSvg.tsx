import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface Props {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
}

export function BarcodeSvg({
  value, width = 1.6, height = 50, fontSize = 12, displayValue = true, className,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        width, height, fontSize, displayValue,
        margin: 4,
      });
    } catch {
      // ignore render errors for invalid values
    }
  }, [value, width, height, fontSize, displayValue]);
  return <svg ref={ref} className={className} aria-label={`Barcode ${value}`} />;
}

export default BarcodeSvg;