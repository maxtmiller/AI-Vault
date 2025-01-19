const express = require('express');
const multer = require('multer');
const { WalletBuilder } = require('@midnight-ntwrk/wallet');
const { NetworkId } = require('@midnight-ntwrk/zswap');
const router = express.Router();

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Midnight wallet
const initializeWallet = async () => {
  const wallet = await WalletBuilder.build(
    'https://indexer.testnet.midnight.network/api/v1/graphql',
    'wss://indexer.testnet.midnight.network/api/v1/graphql',
    'http://localhost:6300',
    'https://rpc.testnet.midnight.network',
    NetworkId.TestNet,
    'error'
  );
  await wallet.start();
  return wallet;
};

// Upload AI model and create transaction
router.post('/upload', upload.single('aiModel'), async (req, res) => {
  try {
    const wallet = await initializeWallet();
    const fileBuffer = req.file.buffer;
    
    // Create metadata for the AI model
    const metadata = {
      name: req.body.name,
      description: req.body.description,
      fileType: req.file.mimetype,
      timestamp: Date.now(),
      creator: req.body.creatorAddress // The seller's address
    };

    // Convert file to transaction data
    // Note: This is a simplified example - you'll need to implement proper file chunking and encryption
    const fileData = {
      metadata: JSON.stringify(metadata),
      content: fileBuffer.toString('base64')
    };

    // Create and balance transaction
    const transaction = await wallet.transferTransaction([{
      amount: BigInt(req.body.price), // Price in tDUST
      tokenType: '01000100000000000000000000000000000000000000000000000000000000',
      receiverAddress: req.body.creatorAddress
    }]);

    // Add file data to transaction (you'll need to implement this based on Midnight's file storage mechanism)
    const balancedTransaction = await wallet.balanceTransaction(transaction);

    // Prove the transaction
    const provenTransaction = await wallet.proveTransaction({
      type: 'TRANSACTION_TO_PROVE',
      transaction: balancedTransaction
    });

    // Submit the transaction
    const submittedTransaction = await wallet.submitTransaction(provenTransaction);

    await wallet.close();

    res.json({
      success: true,
      transactionId: submittedTransaction.id,
      metadata: metadata
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Purchase AI model
router.post('/purchase', async (req, res) => {
  try {
    const wallet = await initializeWallet();
    const { modelId, price, sellerAddress } = req.body;

    // Create purchase transaction
    const transaction = await wallet.transferTransaction([{
      amount: BigInt(price),
      tokenType: '01000100000000000000000000000000000000000000000000000000000000',
      receiverAddress: sellerAddress
    }]);

    // Balance the transaction
    const balancedTransaction = await wallet.balanceTransaction(transaction);

    // Prove the transaction
    const provenTransaction = await wallet.proveTransaction({
      type: 'TRANSACTION_TO_PROVE',
      transaction: balancedTransaction
    });

    // Submit the transaction
    const submittedTransaction = await wallet.submitTransaction(provenTransaction);

    await wallet.close();

    res.json({
      success: true,
      transactionId: submittedTransaction.id
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get AI model metadata and download info
router.get('/model/:modelId', async (req, res) => {
  try {
    const wallet = await initializeWallet();
    
    // Get transaction details from Midnight (implementation depends on how you store the data)
    const modelData = await wallet.state().subscribe(state => {
      // Query the state for the specific model data
      // This is placeholder logic - implement based on your data structure
      return state.transactions.find(tx => tx.id === req.params.modelId);
    });

    await wallet.close();

    if (!modelData) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({
      metadata: modelData.metadata,
      // Add download URL or access mechanism
    });
  } catch (error) {
    console.error('Retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;