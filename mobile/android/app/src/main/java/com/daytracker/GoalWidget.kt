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
        val goalTitle = prefs.getString("goal_title", "No Goal Set") ?: "No Goal Set"
        val daysRemaining = prefs.getInt("days_remaining", 0)
        val progress = prefs.getInt("progress", 0)

        // Create the widget view
        val views = RemoteViews(context.packageName, R.layout.widget_goal)
        
        views.setTextViewText(R.id.widget_goal_title, goalTitle)
        views.setTextViewText(
            R.id.widget_days_remaining,
            if (daysRemaining > 0) "$daysRemaining days remaining" else "Goal completed!"
        )
        views.setProgressBar(R.id.widget_progress_bar, 100, progress, false)
        views.setTextViewText(R.id.widget_progress_text, "$progress%")

        // Create an Intent to launch the app when widget is clicked
        val intent = Intent(context, MainActivity::class.java)
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
