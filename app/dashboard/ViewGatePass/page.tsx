'use client';
import { useState, useEffect } from 'react';
import withAuth from '@/app/components/withAuth';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { toast } from 'react-hot-toast';

const PdfViewerPage = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>('');

  const iframeStyle = {
    width: '100%',
    height: '800px',
    border: 'none',
    transform: 'rotate(0deg)',
    transformOrigin: 'center',
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_DGPBE_URL}/forms/gate-passes`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setGatePasses(data.data);
      })
      .catch((error) => {
        setError(error.message);
      });
  }, []);

  const fetchPdfForSerial = async (serialNumber: string) => {
    try {
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DGPBE_URL}/forms/${serialNumber}/pdf`,
        {
          method: 'GET',
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob) + '#rotation=90&view=FitH';
      setPdfUrl(url);  // Display the PDF URL in the iframe
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the PDF');
    }
  };

  const handleApprove = (serialNumber: string) => {
    const role = localStorage.getItem('role');
    if (role !== 'community_manager') {
      setError('You do not have permission to approve gate passes.');


      toast.error('You do not have permission to approve gate passes.');
      return;
    }
    console.log(`Approving gate pass for serial number: ${serialNumber}`);
    fetch(`${process.env.NEXT_PUBLIC_DGPBE_URL}/forms/${serialNumber}`, {
      method: 'PATCH',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to approve gate pass: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Gate pass approved:', data);
        setGatePasses((prev) =>
          prev.map((gatePass) =>
            gatePass.serialNumber === serialNumber
              ? { ...gatePass, approved: true }
              : gatePass
          )
        );
        toast.success('Gate pass approved successfully.');
      })
      .catch((error) => console.error('Error approving gate pass:', error));
  };

  const handleComplete = (serialNumber: string) => {
    fetch(`${process.env.NEXT_PUBLIC_DGPBE_URL}/forms/${serialNumber}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serialNumber, remarks, securityPerson: localStorage.getItem('email') }),
    
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to complete gate pass: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Gate pass completed:', data);
        setGatePasses((prev) =>
          prev.map((gatePass) =>
            gatePass.serialNumber === serialNumber
              ? { ...gatePass, completed: true }
              : gatePass
          )
        );
        setOpenDialog(false);
      })
      .catch((error) => console.error('Error completing gate pass:', error));
  };

  const handleDialogOpen = (serialNumber:string) => {
    setSerialNumber(serialNumber);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">PDF Viewer</h1>



      {error && <div className="text-red-500 mb-4">{error}</div>}

      {pdfUrl ? (
        <iframe src={pdfUrl} style={iframeStyle} />
      ) : (
        <p>No PDF loaded</p>
      )}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border-b p-2 text-left">Serial Number</th>
              <th className="border-b p-2 text-left">Building Name</th>
              <th className="border-b p-2 text-left">Status</th>
              <th className="border-b p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gatePasses.length > 0 ? (
              gatePasses.map((gatePass) => (
                <tr key={gatePass.serialNumber}>
                  <td className="border-b p-2">
          {/* Create a clickable link for the serial number */}
          <a
            href="#"
            onClick={() => fetchPdfForSerial(gatePass.serialNumber)} // This triggers the fetchPdf function for that serial number
            className="text-blue-600 hover:underline"
          >
            {gatePass.serialNumber}
          </a>
        </td>
                  <td className="border-b p-2">{gatePass.buildingName}</td>
                  <td className="border-b p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        gatePass.approved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {gatePass.approved === true || gatePass.approved === 'true' ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="border-b p-2">
                    {gatePass.approved === true || gatePass.approved === 'true' ? (
                      gatePass.completed === true || gatePass.completed === 'true' ? (
                        <span className="text-gray-500">Completed</span>
                      ) : (
                      <button
                        onClick={() =>handleDialogOpen(gatePass.serialNumber)}
                        className="bg-green-600 text-black rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-200"
                      >
                        Complete
                      </button>
                    )) : (
                      <button
                        onClick={() => handleApprove(gatePass.serialNumber)}
                        className="bg-blue-600 text-black rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-2 text-center">
                  No gate passes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Complete Gate Pass</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Remarks"
            type="text"
            fullWidth
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleComplete(serialNumber)} color="primary">
            Complete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default withAuth(PdfViewerPage);

