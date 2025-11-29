package com.daytracker

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            
            val goalTitle = prefs.getString(PREF_GOAL_TITLE, "No Goal Selected") ?: "No Goal Selected"
            val daysRemaining = prefs.getInt(PREF_DAYS_REMAINING, 0)
            val progress = prefs.getInt(PREF_PROGRESS, 0)

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

        fun triggerUpdate(context: Context) {
            val intent = Intent(context, GoalWidget::class.java)
            intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            val ids = AppWidgetManager.getInstance(context)
                .getAppWidgetIds(android.content.ComponentName(context, GoalWidget::class.java))
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            context.sendBroadcast(intent)
        }
    }
}
