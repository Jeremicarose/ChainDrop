import {useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {usePrivy, useWallets } from '@privy-io/react-auth';
import '../styles/ClaimPage.css';

const API_URL = import.meta.env.VITE_API_URL;

function ClaimPage() {
  const { claimToken } = useParams();
  const navigate = useParams();
  const { login, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);

  // Fetch transfer details
  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const response = await fetch(`${API_URL}/transfer/${claimToken}`);
        const data = await response.json();

        if (data.success) {
          setTransfer(data.data);
        } else {
          setError(data.error || 'Transfer not found');
        }
      } catch (err) {
        setError('Failed to load transer details');
        console.error('Error fetching transfer:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (ckaimToken) {
      fetchTransfer();
    }
  }, [claimToken]);

  // Auto-claim when user is authenticated and has wallet
  useEffect(() => {
    const autoClaim = async () => {
      if (!authenticated || !wallets || wallets.length === 0 || claiming || claimSuccess) {
        return;
      }

      if (!transfer || !transfer.claimable) {
        return;
      }

      await handleClaim();
    };

    if (ready && authenticated) {
      autoClaim();
    }
  }, [authenticated, ready, wallets, transfer]);

  const handleClaim = async () => {
    if (!authenticated || !wallets || wallets.length === 0) {
      setError('Please log in first');
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      const wallet = wallets[0];
      const walletAddress = wallet.address;

      console.log('Claiming with wallet:', walletAddress);

      const response = await fetch(`${API_URL}/transfer/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          
        })
      })
    }
  }}