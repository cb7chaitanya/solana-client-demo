import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function AppBar() {
    return (
        <div className="z-50 border-b border-white/10 bg-black/95 backdrop-blur-sm">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center px-8">
                    <h1 className="text-lg font-medium text-white">
                        Solana Demo
                    </h1>
                </div>
                
                <div className="fixed right-0 items-center px-8">
                    <WalletMultiButton />
                </div>
            </div>
        </div>
    );
}