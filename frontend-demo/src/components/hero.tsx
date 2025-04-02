import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import axios from 'axios';

const Hero: FC = () => {
    const { publicKey, connected, signTransaction } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    const connection = new Connection(import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com');

    const checkBalance = async () => {
        if (!publicKey) return;
        try {
            setLoading(true);
            setError(null);
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / LAMPORTS_PER_SOL);
            setStatus('');
        } catch (error: any) {
            console.error('Error fetching balance:', error);
            setError('Failed to fetch balance. Please try again.');
            setBalance(null);
        } finally {
            setLoading(false);
        }
    };

    const getLatestBlockhash = async (connection: Connection) => {
        const response = await axios.post(connection.rpcEndpoint, {
            jsonrpc: '2.0',
            id: '1',
            method: 'getLatestBlockhash',
            params: [{
                commitment: 'processed',
                minContextSlot: 1000
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        return response.data.result.value;
    };

    const sendTransaction = async (transaction: Transaction, connection: Connection) => {
        if (!signTransaction) throw new Error('Wallet not connected');

        const { blockhash } = await getLatestBlockhash(connection);
        transaction.recentBlockhash = blockhash;

        const signedTx = await signTransaction(transaction);
        const serializedTx = signedTx.serialize();
        const base64Tx = serializedTx.toString('base64');

        const response = await axios.post(connection.rpcEndpoint, {
            jsonrpc: '2.0',
            id: 1,
            method: 'sendTransaction',
            params: [base64Tx]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        return response.data.result;
    };

    const requestAirdrop = async () => {
        if (!publicKey) return;
        try {
            setLoading(true);
            setError(null);
            setStatus('Requesting airdrop...');
            
            const signature = await connection.requestAirdrop(
                publicKey,
                LAMPORTS_PER_SOL
            );
            
            setStatus(`Processing airdrop transaction: ${signature}`);
            
            const latestBlockhash = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature,
                ...latestBlockhash
            });

            if (confirmation.value.err) {
                throw new Error('Transaction failed');
            }

            setStatus(`Airdrop successful! 1 SOL received at ${signature}`);
            await checkBalance();
        } catch (error: any) {
            console.error('Error requesting airdrop:', error);
            if (error.message?.includes('429')) {
                setError('Rate limit exceeded. Please wait a few minutes before requesting another airdrop.');
            } else if (error.message?.includes('insufficient')) {
                setError('Insufficient funds in the airdrop pool. Please try again later.');
            } else if (error.message?.includes('timeout')) {
                setError('Request timed out. Network might be congested.');
            } else {
                setError('Failed to request airdrop. Please try again.');
            }
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!publicKey || !recipient || !amount || !signTransaction) return;
        
        try {
            setLoading(true);
            setError(null);
            setStatus('Creating transfer transaction...');

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(recipient),
                    lamports: LAMPORTS_PER_SOL * parseFloat(amount)
                })
            );

            transaction.feePayer = publicKey;

            setStatus('Please approve the transaction...');
            const signature = await sendTransaction(transaction, connection);
            await new Promise(resolve => setTimeout(resolve, 5000));
            setStatus(`Transfer successful! ${amount} SOL sent to ${recipient} at https://solscan.io/tx/${signature}`);
            await checkBalance();
        } catch (error: any) {
            console.error('Error transferring SOL:', error);
            if (error.message?.includes('insufficient')) {
                setError('Insufficient funds for transfer.');
            } else if (error.message?.includes('invalid')) {
                setError('Invalid recipient address.');
            } else {
                setError(`Failed to complete transfer: ${error.message}`);
            }
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-medium text-white">
                        Solana Demo App
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Connect your wallet and try out basic Solana functionality
                    </p>
                </div>

                {!connected ? (
                    <Alert className="border-white/10 bg-black text-white">
                        <AlertDescription>
                            Please connect your wallet to continue
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Card className="border-white/10 bg-black">
                        <CardContent className="space-y-4 p-6">
                            <Alert className="border-white/10 bg-black/50">
                                <AlertDescription className="font-mono text-white/80">
                                    {publicKey?.toBase58()}
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={checkBalance}
                                    disabled={loading}
                                    className="w-full bg-white text-black hover:bg-white/90"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Check Balance
                                </Button>

                                {balance !== null && (
                                    <Alert className="border-white/10 bg-black/50">
                                        <AlertDescription className="text-white/80">
                                            Balance: {balance} SOL
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button 
                                    onClick={requestAirdrop}
                                    disabled={loading}
                                    className="w-full bg-white text-black hover:bg-white/90"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Request Airdrop (1 SOL)
                                </Button>

                                {error && (
                                    <Alert className="border-red-500/20 bg-red-500/5">
                                        <AlertDescription className="text-red-400">
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {status && !error && (
                                    <Alert className="border-white/10 bg-black/50">
                                        <AlertDescription className="text-white/80">
                                            {status}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {connected && (
                    <Card className="border-white/10 bg-black mt-4">
                        <CardContent className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="recipient" className="text-white">
                                    Recipient Address
                                </Label>
                                <Input
                                    id="recipient"
                                    placeholder="Enter recipient's public key"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="bg-black border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-white">
                                    Amount (SOL)
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="Enter amount to send"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-black border-white/10 text-white"
                                />
                            </div>

                            <Button 
                                onClick={handleTransfer}
                                disabled={loading || !recipient || !amount}
                                className="w-full bg-white text-black hover:bg-white/90"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Transfer SOL
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Hero;
