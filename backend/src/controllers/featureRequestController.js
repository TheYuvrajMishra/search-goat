const FeatureRequest = require('../models/FeatureRequest');

exports.createFeatureRequest = async (req, res) => {
  try {
    const { title, description, category, email } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and category are required.'
      });
    }

    const featureRequest = new FeatureRequest({
      title,
      description,
      category,
      email
    });

    await featureRequest.save();

    res.status(201).json({
      success: true,
      featureRequest
    });
  } catch (error) {
    console.error('Failed to create feature request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feature request: ' + error.message
    });
  }
};

exports.getFeatureRequests = async (req, res) => {
  try {
    const features = await FeatureRequest.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      features
    });
  } catch (error) {
    console.error('Failed to retrieve feature requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feature requests: ' + error.message
    });
  }
};
