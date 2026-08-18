import React from 'react';
import { formatCurrency, formatDate } from '../../utils/permissions';
import { Sale } from '../../types';
import { Icon } from '../ui';
import { useApp } from '../../context/AppContext';

interface ReceiptProps {
  sale: Sale;
  onClose: () => void;
}

export default function ReceiptDocument({ sale, onClose }: ReceiptProps) {
  const { settings } = useApp();
  const sym = settings.currencySymbol;

  return (
    <div className="print-area bg-slate-100 text-black font-mono flex flex-col items-center h-full overflow-y-auto absolute inset-0 z-[100] print:bg-white print:z-auto">
      {/* Non-print header for the modal view */}
      <div className="no-print bg-slate-900 text-white p-4 flex justify-between items-center w-full sticky top-0 shadow-md mb-8">
        <h2 className="font-bold font-sans">Print Preview: Receipt</h2>
        <div className="flex gap-3 font-sans">
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center gap-2">
            <Icon name="printer" size={16} /> Print
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold">
            Close
          </button>
        </div>
      </div>

      {/* Thermal Receipt Paper (approx 80mm wide styling) */}
      <div className="bg-white p-6 shadow-xl print:shadow-none w-[350px] print:w-full print:max-w-[350px] mx-auto text-xs leading-tight">
        <div className="text-center mb-6 border-b-2 border-black border-dashed pb-4">
          <h1 className="font-bold text-xl uppercase mb-1">Pramukh Hardwaremart LTD</h1>
          <p>Jamboni, Annex</p>
          <p>Eldoret - 30100, Kenya</p>
          <p>Tel: +254 719 188 886</p>
          <p className="mt-2 text-[10px]">PIN: P051234567X</p>
        </div>

        <div className="mb-4 space-y-1">
          <div className="flex justify-between"><span>Receipt No:</span> <span className="font-bold">{sale.invoiceNo}</span></div>
          <div className="flex justify-between"><span>Date:</span> <span>{formatDate(sale.date)}</span></div>
          <div className="flex justify-between"><span>Cashier:</span> <span>{sale.cashierId || 'Admin'}</span></div>
          <div className="flex justify-between"><span>Customer:</span> <span className="font-bold">{sale.customerName || 'Walk-in'}</span></div>
        </div>

        <table className="w-full mb-4 border-t-2 border-b-2 border-black border-dashed py-2">
          <thead>
            <tr className="border-b border-black border-dashed">
              <th className="text-left py-2 font-bold w-1/2">Item</th>
              <th className="text-center py-2 font-bold w-1/6">Qty</th>
              <th className="text-right py-2 font-bold w-1/3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-2 pr-2">
                  <div className="font-bold truncate max-w-[150px]">{item.productName}</div>
                  <div className="text-[10px] text-gray-500">@{formatCurrency(item.unitPrice, sym)}</div>
                </td>
                <td className="py-2 text-center font-bold">x{item.quantity}</td>
                <td className="py-2 text-right font-bold">{formatCurrency(item.total, sym)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1.5 mb-6 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(sale.subtotal, sym)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(sale.discount, sym)}</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="flex justify-between">
              <span>Tax (VAT):</span>
              <span>{formatCurrency(sale.tax, sym)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base border-t-2 border-black border-dashed pt-2 mt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(sale.total, sym)}</span>
          </div>
          <div className="flex justify-between font-bold pt-1">
            <span>Paid By:</span>
            <span className="uppercase">{sale.paymentMethod.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="text-center border-t-2 border-black border-dashed pt-4 mt-6">
          <p className="font-bold mb-1">THANK YOU FOR YOUR BUSINESS!</p>
          <p className="text-[10px] mb-4">BEST HARDWARE. STRONGER FUTURE.</p>
          
          <svg className="mx-auto w-[250px] h-[50px] no-print opacity-50" viewBox="0 0 250 50">
            {/* Mock barcode for aesthetics */}
            <rect x="10" y="5" width="2" height="40" fill="black" />
            <rect x="14" y="5" width="4" height="40" fill="black" />
            <rect x="22" y="5" width="2" height="40" fill="black" />
            <rect x="26" y="5" width="8" height="40" fill="black" />
            <rect x="36" y="5" width="2" height="40" fill="black" />
            <rect x="42" y="5" width="6" height="40" fill="black" />
            <rect x="52" y="5" width="2" height="40" fill="black" />
            <rect x="58" y="5" width="10" height="40" fill="black" />
            <rect x="72" y="5" width="2" height="40" fill="black" />
            <rect x="76" y="5" width="4" height="40" fill="black" />
            <rect x="84" y="5" width="6" height="40" fill="black" />
            <rect x="92" y="5" width="2" height="40" fill="black" />
            <rect x="98" y="5" width="8" height="40" fill="black" />
            <rect x="110" y="5" width="2" height="40" fill="black" />
            <rect x="114" y="5" width="4" height="40" fill="black" />
            <rect x="122" y="5" width="2" height="40" fill="black" />
            <rect x="128" y="5" width="6" height="40" fill="black" />
            <rect x="138" y="5" width="2" height="40" fill="black" />
            <rect x="144" y="5" width="8" height="40" fill="black" />
            <rect x="156" y="5" width="4" height="40" fill="black" />
            <rect x="164" y="5" width="2" height="40" fill="black" />
            <rect x="168" y="5" width="10" height="40" fill="black" />
            <rect x="182" y="5" width="2" height="40" fill="black" />
            <rect x="186" y="5" width="6" height="40" fill="black" />
            <rect x="196" y="5" width="4" height="40" fill="black" />
            <rect x="204" y="5" width="2" height="40" fill="black" />
            <rect x="210" y="5" width="8" height="40" fill="black" />
            <rect x="222" y="5" width="2" height="40" fill="black" />
            <rect x="228" y="5" width="4" height="40" fill="black" />
            <rect x="236" y="5" width="2" height="40" fill="black" />
          </svg>
        </div>
      </div>
    </div>
  );
}
