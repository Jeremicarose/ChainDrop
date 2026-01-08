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
        const response = await fetch()
      }
    }
  })
}