const Notification = require('../models/Notification');

/**
 * Get all notifications
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({
      notifications: notifications.map((n) => ({
        _id: n._id,
        type: n.type,
        title: n.title,
        content: n.content,
        relatedUserId: n.relatedUserId,
        relatedUsername: n.relatedUsername,
        relatedUserId7Digit: n.relatedUserId7Digit,
        relatedId: n.relatedId,
        actionUrl: n.actionUrl,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notifications as read
 * PUT /api/notifications/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationIds, markAll = false } = req.body;

    if (markAll) {
      await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: req.user._id },
        { isRead: true, readAt: new Date() }
      );
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ message: 'Notifications marked as read', unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  getUnreadCount,
};
