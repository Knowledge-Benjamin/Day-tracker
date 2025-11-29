package com.daytracker

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class GoalWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        // Read data from SharedPreferences
        val prefs = context.getSharedPreferences("DayTrackerWidget", Context.MODE_PRIVATE)
        val goalClientId = prefs.getString("goal_client_id", "") ?: ""
        val goalTitle = prefs.getString("goal_title", "No Goal Set") ?: "No Goal Set"
        val description = prefs.getString("goal_description", "") ?: ""
        val daysLogged = prefs.getInt("days_logged", 0)
        val daysElapsed = prefs.getInt("days_elapsed", 0)
        val daysRemaining = prefs.getInt("days_remaining", 0)
        val loggedProgress = prefs.getFloat("logged_progress", 0f)
        val elapsedProgress = prefs.getFloat("elapsed_progress", 0f)

        // Create the widget view
        val views = RemoteViews(context.packageName, R.layout.widget_goal)
        
        // Set all text values
        views.setTextViewText(R.id.widget_goal_title, goalTitle)
        views.setTextViewText(R.id.widget_goal_description, 
            if (description.isNotEmpty()) description else "No description")
        views.setTextViewText(R.id.widget_days_logged, daysLogged.toString())
        views.setTextViewText(R.id.widget_days_elapsed, daysElapsed.toString())
        views.setTextViewText(R.id.widget_days_remaining, daysRemaining.toString())
        
        // Set progress bars
        views.setProgressBar(R.id.widget_logged_progress_bar, 100, loggedProgress.toInt(), false)
        views.setProgressBar(R.id.widget_elapsed_progress_bar, 100, elapsedProgress.toInt(), false)
        
        // Set progress text with 3 decimal places
        views.setTextViewText(R.id.widget_logged_progress_text, 
            String.format("%.3f%%", loggedProgress))
        views.setTextViewText(R.id.widget_elapsed_progress_text, 
            String.format("%.3f%%", elapsedProgress))

        // Create an Intent to launch the app and open goal details
        val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("goalClientId", goalClientId)
            putExtra("openGoalDetail", true)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_goal_title, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
