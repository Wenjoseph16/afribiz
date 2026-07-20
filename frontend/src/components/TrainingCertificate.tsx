'use client';
import { jsPDF } from 'jspdf';

export default function TrainingCertificate({
  userName,
  trainingTitle,
  businessName,
  onClose,
}: {
  userName: string;
  trainingTitle: string;
  businessName: string;
  onClose: () => void;
}) {
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(100, 100, 255);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setDrawColor(150, 150, 255);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

    doc.setFontSize(36);
    doc.setTextColor(60, 60, 60);
    doc.text('CERTIFICAT', pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Ce certificat est décerné à', pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(60, 60, 180);
    doc.text(userName, pageWidth / 2, 105, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('pour avoir complété avec succès la formation', pageWidth / 2, 125, {
      align: 'center',
    });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 140);
    doc.text(trainingTitle, pageWidth / 2, 148, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${businessName} - AfriBiz`, pageWidth / 2, 175, { align: 'center' });

    const today = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(10);
    doc.text(`Délivré le ${today}`, pageWidth / 2, 195, { align: 'center' });

    doc.save(`certificat-${trainingTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Félicitations !</h3>
        <p className="text-gray-500 mb-6">Vous avez complété la formation avec succès.</p>
        <button
          onClick={downloadPDF}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:from-amber-600 hover:to-orange-700 transition-all"
        >
          Télécharger le certificat
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-all"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
