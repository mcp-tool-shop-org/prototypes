# Sample Datasets

Example datasets for testing Training Studio functionality.

## iris.csv

Classic Iris flower classification dataset with 60 samples:
- **Features**: sepal_length, sepal_width, petal_length, petal_width
- **Label**: species (setosa, versicolor, virginica)
- **Task**: Multi-class classification (3 classes)

### Recommended Settings

- **Model Type**: MLP Classifier
- **Hidden Layers**: 8, 4 (or 16, 8 for more capacity)
- **Activation**: ReLU
- **Epochs**: 50-100
- **Batch Size**: 8-16
- **Learning Rate**: 0.01

### Expected Results

With the recommended settings, you should achieve:
- Training Accuracy: 95-100%
- Validation Accuracy: 90-95%

## binary_classification.csv

Simple binary classification dataset for testing:
- **Features**: feature_1, feature_2
- **Label**: class (0 or 1)
- **Task**: Binary classification

### Recommended Settings

- **Model Type**: MLP Classifier
- **Hidden Layers**: 4
- **Activation**: ReLU
- **Epochs**: 30
- **Batch Size**: 8
- **Learning Rate**: 0.01

## Creating Your Own Datasets

Your CSV files should:
1. Have a header row with column names
2. Use numeric values for features (or categorical for labels)
3. Include at least 20 samples for meaningful training
4. Have balanced class distribution when possible

### Tips

- Normalize numeric features to similar scales
- Remove or fill missing values
- Use meaningful column names
- Start with smaller datasets to verify your pipeline
