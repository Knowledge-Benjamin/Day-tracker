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
    fun saveWidgetData(goalTitle: String, daysRemaining: Int, progress: Int) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences("DayTrackerWidget", android.content.Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("goal_title", goalTitle)
            putInt("days_remaining", daysRemaining)
            putInt("progress", progress)
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
