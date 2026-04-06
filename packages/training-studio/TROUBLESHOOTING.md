# Troubleshooting Guide

Solutions for common issues when using Training Studio.

## Training Issues

### Training is Very Slow

**Symptoms**: Each epoch takes much longer than expected.

**Solutions**:
1. Check which TensorFlow.js backend is active (shown in header)
   - WebGPU: Fastest (requires compatible GPU)
   - WebGL: Good performance (most common)
   - CPU: Slowest (fallback)
2. Reduce batch size (smaller batches = less memory but more iterations)
3. Reduce model complexity (fewer hidden layers/units)
4. Close other browser tabs to free GPU memory

### NaN or Infinity in Loss

**Symptoms**: Loss shows "NaN" or training metrics explode to infinity.

**Solutions**:
1. Lower the learning rate (try 0.001 instead of 0.01)
2. Enable normalization for your features
3. Check for missing values in your dataset
4. Reduce the number of hidden layers
5. Add dropout to prevent gradient explosion

### Training Stuck at 0% Accuracy

**Symptoms**: Accuracy stays near 0 or at random chance level.

**Solutions**:
1. Verify you selected the correct label column
2. Check if your data has enough samples per class
3. Increase the number of epochs
4. Try a different optimizer (Adam usually works best)
5. Increase model capacity (more hidden units)

### Out of Memory Error

**Symptoms**: Browser crashes or shows memory warning.

**Solutions**:
1. Reduce batch size
2. Reduce dataset size for initial testing
3. Use a simpler model architecture
4. Close other applications
5. Try a browser with better memory management

## Dataset Issues

### CSV Not Loading

**Symptoms**: File selection does nothing or shows error.

**Solutions**:
1. Ensure file has .csv extension
2. Check file encoding is UTF-8
3. Verify first row contains headers
4. Remove any special characters from column names
5. Check for trailing commas or inconsistent column counts

### All Columns Show as Categorical

**Symptoms**: Numeric columns displayed as categorical.

**Solutions**:
1. Check for non-numeric characters in numeric columns
2. Remove currency symbols ($, €) from values
3. Use decimal point (.) not comma (,) for decimals
4. Remove thousand separators from numbers

### Class Imbalance Warning

**Symptoms**: One class has many more samples than others.

**Solutions**:
1. Collect more data for underrepresented classes
2. Use class weighting (coming in future version)
3. Undersample majority class
4. Consider data augmentation techniques

## Export Issues

### Export Button Disabled

**Symptoms**: Cannot click the Export Bundle button.

**Solutions**:
1. Complete training first (at least 1 epoch)
2. Wait for training to fully complete
3. Check for errors in the training log

### Export File Not Created

**Symptoms**: Export appears to succeed but no file appears.

**Solutions**:
1. Check your Downloads folder
2. Verify you have write permissions to the selected folder
3. Ensure sufficient disk space
4. Try exporting to a different location

### Bundle Validation Fails

**Symptoms**: Exported bundle fails validation when re-imported.

**Solutions**:
1. Don't modify bundle files manually
2. Ensure complete export (don't cancel mid-export)
3. Report the issue with bundle digest for investigation

## UI Issues

### Charts Not Displaying

**Symptoms**: Training/accuracy charts show blank.

**Solutions**:
1. Complete at least 2 training epochs
2. Refresh the page and retry
3. Check browser console for JavaScript errors
4. Try a different browser

### Buttons Not Responding

**Symptoms**: Clicking buttons has no effect.

**Solutions**:
1. Check if an operation is in progress
2. Look for error messages in the UI
3. Refresh the page
4. Clear browser cache

### Layout Broken on Mobile

**Symptoms**: UI elements overlap or are unusable.

**Solutions**:
1. Use landscape orientation
2. Use desktop or tablet for best experience
3. Try zooming out in browser

## Performance Tips

### Faster Training

1. Use WebGPU/WebGL backend (check header)
2. Use appropriate batch size (32 is often optimal)
3. Enable early stopping to avoid unnecessary epochs
4. Start with smaller models, increase if underfitting

### Memory Efficiency

1. Close unused browser tabs
2. Process datasets in chunks
3. Clear training history periodically
4. Restart app after many training runs

### Best Practices

1. Always normalize numeric features
2. Use train/validation split (80/20 typical)
3. Monitor both training and validation metrics
4. Save models regularly during experimentation

## Getting Help

If these solutions don't resolve your issue:

1. Check [GitHub Issues](https://github.com/mcp-tool-shop-org/training-studio/issues) for similar problems
2. Open a new issue with:
   - Steps to reproduce
   - Browser and OS version
   - TensorFlow.js backend (shown in header)
   - Dataset characteristics (size, columns)
   - Error messages from browser console

## Frequently Asked Questions

### What browsers are supported?

- **Recommended**: Chrome 90+, Edge 90+
- **Supported**: Firefox 85+, Safari 14+
- **Not Supported**: Internet Explorer

### What GPU is required?

No GPU is required - CPU fallback is automatic. For best performance:
- WebGPU: Modern GPUs with WebGPU support
- WebGL: Most GPUs from 2015+

### Can I use my own model architecture?

Currently, the UI supports MLP (dense) architectures. Custom architectures via code will be available in a future version.

### What file formats are supported?

- **Input**: CSV with header row
- **Export**: ZIP bundle containing TensorFlow.js format (model.json + weights.bin)

### Is my data sent to a server?

No. All training happens locally in your browser. Your data never leaves your device.
