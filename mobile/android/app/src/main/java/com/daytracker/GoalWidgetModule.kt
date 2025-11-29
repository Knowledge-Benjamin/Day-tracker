package com.daytracker

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GoalWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "GoalWidgetModule"
    }

    @ReactMethod
    fun saveWidgetData(
        goalClientId: String,
        goalTitle: String,
        description: String,
        daysLogged: Int,
        daysElapsed: Int,
        daysRemaining: Int,
        loggedProgress: Double,
        elapsedProgress: Double
    ) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("DayTrackerWidget", android.content.Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("goal_client_id", goalClientId)
            putString("goal_title", goalTitle)
            putString("goal_description", description)
            putInt("days_logged", daysLogged)
            putInt("days_elapsed", daysElapsed)
            putInt("days_remaining", daysRemaining)
            putFloat("logged_progress", loggedProgress.toFloat())
            putFloat("elapsed_progress", elapsedProgress.toFloat())
            apply()
        }
    }

    @ReactMethod
    fun updateWidget() {
        val context = reactApplicationContext
        val intent = android.content.Intent(context, GoalWidget::class.java)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        val ids = AppWidgetManager.getInstance(context)
            .getAppWidgetIds(ComponentName(context, GoalWidget::class.java))
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
    }
}
