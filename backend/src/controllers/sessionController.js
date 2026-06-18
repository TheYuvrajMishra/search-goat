const Session = require('../models/Session');
const Message = require('../models/Message');

class SessionController {
  // Create a new session
  async createSession(req, res) {
    try {
      const session = new Session({
        title: req.body.title || 'New Investigation'
      });
      await session.save();
      return res.status(201).json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Create Session Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all sessions sorted by updatedAt descending
  async getSessions(req, res) {
    try {
      const sessions = await Session.find().sort({ updatedAt: -1 });
      return res.status(200).json({
        success: true,
        sessions
      });
    } catch (error) {
      console.error('Get Sessions Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get a single session and its messages
  async getSessionDetails(req, res) {
    try {
      const { id } = req.params;
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      const messages = await Message.find({ sessionId: id }).sort({ createdAt: 1 });
      return res.status(200).json({
        success: true,
        session: {
          id: session._id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messages: messages.map(msg => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            results: msg.results,
            keywords: msg.keywords,
            report: msg.report
          }))
        }
      });
    } catch (error) {
      console.error('Get Session Details Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Rename a session's title
  async renameSession(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body;

      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Title cannot be empty'
        });
      }

      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      session.title = title;
      await session.save();

      return res.status(200).json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Rename Session Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete a session and its associated messages
  async deleteSession(req, res) {
    try {
      const { id } = req.params;
      const session = await Session.findByIdAndDelete(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Cascading delete messages
      await Message.deleteMany({ sessionId: id });

      return res.status(200).json({
        success: true,
        message: 'Session and its messages deleted successfully.'
      });
    } catch (error) {
      console.error('Delete Session Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SessionController();
