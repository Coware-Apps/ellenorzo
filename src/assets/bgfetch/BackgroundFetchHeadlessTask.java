package com.transistorsoft.cordova.backgroundfetch;

import hu.coware.ellenorzo.R;

import android.app.PendingIntent;
import android.content.Context;

import com.android.volley.toolbox.JsonArrayRequest;
import com.transistorsoft.tsbackgroundfetch.BackgroundFetch;

import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BackgroundFetchHeadlessTask implements HeadlessTask {

    private final String LU_PREFIX = "LU_";
    private final String LU_STUDENT_KEY = LU_PREFIX + "student";
    private final String LU_MESSAGELIST_KEY = LU_PREFIX + "messageList";

    private static Map<String, EllenorzoNotificationChannel> CHANNELS = new HashMap<String, EllenorzoNotificationChannel>() {
        {
            put("evaluation",
                    new EllenorzoNotificationChannel("hu.coware.ellenorzo.evaluations", "Evaluations (Értékelések)"));
            put("note", new EllenorzoNotificationChannel("hu.coware.ellenorzo.notes", "Notes (Feljegyzések)"));
            put("absence", new EllenorzoNotificationChannel("hu.coware.ellenorzo.absences", "Absences (Mulasztások)"));
            put("message", new EllenorzoNotificationChannel("hu.coware.ellenorzo.messages", "Messages (Üzenetek)"));
        }
    };

    private String USER_AGENT = "Kreta.Ellenorzo/2.9.11.2020033003 (Android; SM-G950F 0.0)";
    final String CLIENT_ID = "919e0c1c-76a2-4646-a2fb-7085bbbf3c56";

    private SQLiteDatabase db;

    @Override
    public void onFetch(Context context, String taskId) {
        Log.d(BackgroundFetch.TAG, "My BackgroundFetchHeadlessTask:  onFetch: " + taskId);
        Log.i("[BGF]", "----------BEGIN----------");

        createNotificationChannels(context);

        initialize(context, new RenewTokenCallback() {
            @Override
            public void onSuccess(String result) {

            }

            @Override
            public void onError(String result) {
                Log.i("[BGF] onError", result);
            }

            @Override
            public void onEndTask() {
                Log.i("[BGF]", "----------FINISH----------");
                db.close();
                BackgroundFetch.getInstance(context).finish(taskId);
            }
        });

    }

    private void createNotificationChannels(Context context) {
        // Create the NotificationChannel, but only on API 26+ because
        // the NotificationChannel class is new and not in the support library
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            List<NotificationChannel> channels = new ArrayList<>();

            for (EllenorzoNotificationChannel value : CHANNELS.values()) {
                channels.add(new NotificationChannel(value.id, value.name, NotificationManager.IMPORTANCE_DEFAULT));
            }

            // Register the channel with the system; you can't change the importance
            // or other notification behaviors after this
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannels(channels);
        }
    }

    protected void doKretaObjectRequest(Context context, final String instituteCode, final String endpointOrUrl,
            final Tokens tokens, final String queryString, final int method, final Boolean asFullUrl,
            final VolleyCallback callback) {

        RequestQueue queue = Volley.newRequestQueue(context);
        String url;

        if (!asFullUrl) {
            url = "https://" + instituteCode + ".e-kreta.hu" + endpointOrUrl;
        } else {
            url = endpointOrUrl;
        }

        JsonObjectRequest request = new JsonObjectRequest(method, url, null, new Response.Listener<JSONObject>() {
            @Override
            public void onResponse(JSONObject response) {
                callback.onSuccess(response.toString());
            }
        }, new Response.ErrorListener() {

            @Override
            public void onErrorResponse(VolleyError error) {
                // TODO: Handle error
                Log.e("Response (error)", error.fillInStackTrace().toString());
                callback.onError(error.toString());
            }
        }) {

            @Override
            public String getBodyContentType() {
                return "application/x-www-form-urlencoded; charset=UTF-8";
            }

            @Override
            public byte[] getBody() {
                return queryString.getBytes(StandardCharsets.UTF_8);
            }

            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Accept", "application/json");
                headers.put("User-Agent", USER_AGENT);
                headers.put("Authorization", "Bearer " + tokens.access_token);

                return headers;
            }
        };

        queue.add(request);
    }

    protected void doKretaArrayRequest(Context context, final String instituteCode, final String endpointOrUrl,
            final Tokens tokens, final String queryString, final int method, final Boolean asFullUrl,
            final VolleyCallback callback) {

        RequestQueue queue = Volley.newRequestQueue(context);
        String url;

        if (!asFullUrl) {
            url = "https://" + instituteCode + ".e-kreta.hu" + endpointOrUrl;
        } else {
            url = endpointOrUrl;
        }

        JsonArrayRequest request = new JsonArrayRequest(method, url, null, new Response.Listener<JSONArray>() {
            @Override
            public void onResponse(JSONArray response) {
                callback.onSuccess(response.toString());
            }
        }, new Response.ErrorListener() {

            @Override
            public void onErrorResponse(VolleyError error) {
                // TODO: Handle error
                Log.e("Response (error)", error.fillInStackTrace().toString());
                callback.onError(error.toString());
            }
        }) {

            @Override
            public String getBodyContentType() {
                return "application/x-www-form-urlencoded; charset=UTF-8";
            }

            @Override
            public byte[] getBody() {
                return queryString.getBytes(StandardCharsets.UTF_8);
            }

            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Accept", "application/json");
                headers.put("User-Agent", USER_AGENT);
                headers.put("Authorization", "Bearer " + tokens.access_token);

                return headers;
            }
        };

        queue.add(request);
    }

    private NotificationCompat.Builder buildNotification(Context context, String title, String message,
            String channelKey) {
        return new NotificationCompat.Builder(context, CHANNELS.get(channelKey).id)
                .setSmallIcon(R.drawable.ic_notification_small).setContentTitle(title).setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);
    }

    /**
     * Reads the initData of the users from _ionicstorage, renews tokens, and calls
     * the saveUIDs function If the token renewal failed with an error, the tokens
     * of the old userInitData will not be modified
     * 
     * @param context  Application context
     * @param callback A RenewTokenCallback that will be called for every user if
     *                 the tokens were successfully renewed
     */
    private void initialize(Context context, RenewTokenCallback callback) {
        try {

            this.db = SQLiteDatabase.openOrCreateDatabase("/data/data/hu.coware.ellenorzo/databases/_ionicstorage",
                    null);
            String query = "SELECT value FROM _ionickv WHERE `key`='usersInitData'";
            Cursor cursor = this.db.rawQuery(query, null);
            String res = "";

            if (cursor.moveToNext()) {
                res = cursor.getString(0);
            }

            cursor.close();

            if (res == "") {
                Log.w("[BGF] NOUSERS", "No users logged in, finishing up");
                callback.onEndTask();
                return;
            }
            // if(res == null) return;

            JSONArray JSONUIDS = new JSONArray(res);
            JSONArray updatedUids = new JSONArray();

            for (int i = 0; i < JSONUIDS.length(); i++) {
                JSONObject JSONUID = JSONUIDS.getJSONObject(i);
                UserInitData uid = new UserInitData();

                JSONObject JSONTokens = JSONUID.getJSONObject("tokens");
                Tokens tokens = new Tokens(JSONTokens.getString("access_token"), JSONTokens.getString("refresh_token"),
                        JSONTokens.getInt("expires_in"), JSONTokens.getString("token_type"));
                uid.tokens = tokens;

                JSONObject JSONInstitute = JSONUID.getJSONObject("institute");
                Institute institute = new Institute(JSONInstitute.getInt("InstituteId"),
                        JSONInstitute.getString("InstituteCode"), JSONInstitute.getString("Name"),
                        JSONInstitute.getString("Url"));
                uid.Institute = institute;

                uid.id = JSONUID.getInt("id");
                uid.fullName = JSONUID.getString("fullName");
                uid.lastNotificationSetTime = JSONUID.getInt("lastNotificationSetTime");
                uid.notificationsEnabled = JSONUID.getBoolean("notificationsEnabled");

                Log.i("[BGF] USERFOUND", uid.fullName);

                this.renewTokens(context, uid, new VolleyCallback() {
                    @Override
                    public void onSuccess(String result) {
                        Log.i("[BGF] Renewed tokens", uid.fullName);

                        try {
                            JSONUID.remove("tokens");
                            JSONUID.put("tokens", new JSONObject(result));

                            updatedUids.put(JSONUID);

                            showNotifications(context, uid, new NotificationCallback() {

                                @Override
                                public void onFinish() {
                                    saveUIDs(JSONUIDS, updatedUids, callback);
                                }
                            });

                            callback.onSuccess(result);
                        } catch (JSONException e) {
                            Log.e("[BGF] Error parsing tokens", e.toString());
                            callback.onError(e.toString());
                        }
                    }

                    @Override
                    public void onError(String result) {
                        Log.w("[BGF] Not updating UID", result);

                        updatedUids.put(JSONUID);
                        saveUIDs(JSONUIDS, updatedUids, callback);
                    }
                });
            }
        } catch (Exception e) {
            Log.e("[BGF] Error with DB", e.toString());
            callback.onError(e.toString());
            callback.onEndTask();
        }
    }

    /**
     * Renews the tokens for a user
     * 
     * @param context  Application context
     * @param user     The user to renew the tokens for
     * @param callback A VolleyCallback that will be called once the http request
     *                 finishes
     */
    private void renewTokens(Context context, UserInitData user, VolleyCallback callback) {

        RequestQueue queue = Volley.newRequestQueue(context);

        String url = user.Institute.Url + "/idp/api/v1/Token";

        Log.i("[BGF] RENEWTKN", user.fullName + ", RT: " + user.tokens.refresh_token);

        JsonObjectRequest request = new JsonObjectRequest(Request.Method.POST, url, null,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        callback.onSuccess(response.toString());
                    }
                }, new Response.ErrorListener() {

                    @Override
                    public void onErrorResponse(VolleyError error) {
                        callback.onError(error.toString());
                        Log.e("Response (error)", error.toString());
                    }
                }) {

            @Override
            public String getBodyContentType() {
                return "application/x-www-form-urlencoded; charset=UTF-8";
            }

            @Override
            public byte[] getBody() {
                String params = "refresh_token=" + user.tokens.refresh_token + "&institute_code="
                        + user.Institute.InstituteCode + "&grant_type=refresh_token" + "&client_id=" + CLIENT_ID;

                return params.getBytes(Charset.forName("UTF-8"));
            }

            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<String, String>();
                headers.put("Accept", "application/json");
                headers.put("User-Agent", USER_AGENT);

                return headers;
            }
        };

        queue.add(request);
    }

    private void showNotifications(Context context, UserInitData user, NotificationCallback callback) {
        doKretaObjectRequest(context, user.Institute.InstituteCode.toString(), "/mapi/api/v1/StudentAmi", user.tokens,
                "fromDate=null&toDate=null", Request.Method.GET, false, new VolleyCallback() {
                    @Override
                    public void onSuccess(String result) {

                        try {
                            JSONObject student = new JSONObject(result);
                            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
                            // KRÉTA date format Ɛ>
                            DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
                            PendingIntent openApp = PendingIntent.getActivity(context, 0, new Intent(),
                                    PendingIntent.FLAG_UPDATE_CURRENT);
                            Integer totalNotificationCount = 0;

                            Long lastUpdatedStudent = null;

                            /**
                             * STUDENT
                             */
                            Cursor cursor = db
                                    .rawQuery("SELECT value FROM _ionickv WHERE `key`='" + LU_STUDENT_KEY + "'", null);
                            if (cursor.moveToNext()) {
                                lastUpdatedStudent = cursor.getLong(0);
                            }
                            cursor.close();

                            if (lastUpdatedStudent != null) {
                                /**
                                 * EVALUATIONS
                                 */
                                JSONArray evaluations = student.getJSONArray("Evaluations");
                                for (int i = 0; i < evaluations.length(); i++) {

                                    JSONObject evaluation = evaluations.getJSONObject(i);
                                    if (df.parse(evaluation.getString("CreatingTime")).getTime() > lastUpdatedStudent) {
                                        Log.i("[BGF] Evaldate",
                                                "Unix: " + df.parse(evaluation.getString("CreatingTime")).getTime()
                                                        + " LU_unix" + lastUpdatedStudent.toString());

                                        notificationManager.notify(evaluation.getInt("EvaluationId"),
                                                buildNotification(context,
                                                        student.getString("Name") + " új értékelést kapott",
                                                        "Értéke: " + evaluation.getString("Value") + ", " + "tantárgy: "
                                                                + evaluation.getString("Subject"),
                                                        "evaluation").setContentIntent(openApp).build());

                                        totalNotificationCount++;
                                    }

                                    // Even I don't trust this code enough
                                    if (totalNotificationCount > 10)
                                        break;
                                }

                                /**
                                 * NOTES
                                 */
                                JSONArray notes = student.getJSONArray("Notes");
                                for (int i = 0; i < notes.length(); i++) {

                                    JSONObject note = notes.getJSONObject(i);

                                    if (df.parse(note.getString("CreatingTime")).getTime() > lastUpdatedStudent) {
                                        notificationManager.notify(note.getInt("NoteId"),
                                                buildNotification(context, "Új " + note.getString("Type") + " érkezett",
                                                        "Tanuló: " + student.getString("Name"), "note")
                                                                .setContentIntent(openApp).build());
                                        totalNotificationCount++;
                                    }

                                    if (totalNotificationCount > 10)
                                        break;
                                }

                                /**
                                 * ABSENCES
                                 */
                                JSONArray absences = student.getJSONArray("Absences");
                                for (int i = 0; i < absences.length(); i++) {

                                    JSONObject absence = absences.getJSONObject(i);

                                    if (df.parse(absence.getString("CreatingTime")).getTime() > lastUpdatedStudent) {

                                        String text = absence.getString("Type") != "Delay"
                                                ? "Új" + " " + absence.getString("TypeName")
                                                : "Új késés" + " (" + absence.getString("DelayTimeMinutes") + "p" + ")";

                                        text = text + " " + absence.getString("Subject") + " tantárgyból";

                                        notificationManager
                                                .notify(absence.getInt("AbsenceId"),
                                                        buildNotification(context, text,
                                                                "Tanuló: " + student.getString("Name"), "absence")
                                                                        .setContentIntent(openApp).build());
                                        totalNotificationCount++;
                                    }

                                    if (totalNotificationCount > 10)
                                        break;
                                }

                                if (totalNotificationCount == 0)
                                    Log.i("[BGF] NOUPDATES", "No new data from student query");

                                db.execSQL("UPDATE _ionickv SET `value`='" + new Date().getTime() + "' WHERE `key`='"
                                        + LU_STUDENT_KEY + "'");
                            } else {
                                Log.w("[BGF] Missing student unix",
                                        "Could not find " + LU_STUDENT_KEY + " in DB, skipping it");
                            }

                            /**
                             * MESSAGE_LIST
                             */
                            doKretaArrayRequest(context, user.Institute.InstituteCode.toString(),
                                    "https://eugyintezes.e-kreta.hu/integration-kretamobile-api/v1/kommunikacio/postaladaelemek/sajat",
                                    user.tokens, "", Request.Method.GET, true, new VolleyCallback() {

                                        @Override
                                        public void onSuccess(String result) {

                                            try {
                                                JSONArray messageList = new JSONArray(result);
                                                Integer totalNotificationCount = 0;
                                                Long lastUpdatedMessageList = null;
                                                Cursor cursor = db.rawQuery("SELECT value FROM _ionickv WHERE `key`='"
                                                        + LU_MESSAGELIST_KEY + "'", null);
                                                if (cursor.moveToNext()) {
                                                    lastUpdatedMessageList = cursor.getLong(0);
                                                }
                                                cursor.close();

                                                if (lastUpdatedMessageList != null) {
                                                    for (int i = 0; i < messageList.length(); i++) {

                                                        JSONObject message = messageList.getJSONObject(i);

                                                        if (
                                                        // checking for inbox messages only
                                                        message.getJSONObject("tipus").getInt("azonosito") == 1 && df
                                                                .parse(message.getJSONObject("uzenet")
                                                                        .getString("kuldesDatum"))
                                                                .getTime() > lastUpdatedMessageList) {
                                                            notificationManager.notify(message.getInt("azonosito"),
                                                                    buildNotification(context,
                                                                            "Új üzenet"
                                                                                    + " " + student.getString("Name")
                                                                                    + " " + "tanulónak",
                                                                            "Feladó: " + message.getJSONObject("uzenet")
                                                                                    .getString("feladoNev"),
                                                                            "message").setContentIntent(openApp)
                                                                                    .build());

                                                            totalNotificationCount++;
                                                        }
                                                        if (totalNotificationCount > 10)
                                                            break;
                                                    }
                                                } else {
                                                    Log.w("[BGF] MISSINGUNIX", "Could not find " + LU_MESSAGELIST_KEY
                                                            + " in DB, skipping it");
                                                }

                                                if (totalNotificationCount == 0)
                                                    Log.i("[BGF] NOUPDATES", "No new data from messageList query");
                                                db.execSQL("UPDATE _ionickv SET `value`='" + new Date().getTime()
                                                        + "' WHERE `key`='" + LU_MESSAGELIST_KEY + "'");
                                            } catch (Exception e) {
                                                Log.e("[BGF] E parsing messageList", e.toString());
                                            }

                                            callback.onFinish();
                                        }

                                        @Override
                                        public void onError(String result) {
                                            callback.onFinish();
                                        }
                                    });
                        } catch (Exception e) {
                            // parse or jsonException
                            Log.e("[BGF] Error parsing student", e.toString());
                            callback.onFinish();
                        }
                    }

                    @Override
                    public void onError(String result) {
                        Log.e("[BGF] Error getting student", result);
                        callback.onFinish();
                    }
                });
    }

    /**
     * Saves updated userInitData to DB (if oldUIDs.length() == newUIDs.length())
     * 
     * @param oldUIDs initData read from DB (before token refresh)
     * @param newUIDs initData after token refresh
     */
    private void saveUIDs(JSONArray oldUIDs, JSONArray newUIDs, RenewTokenCallback callback) {
        if (oldUIDs.length() == newUIDs.length()) {
            Log.i("[BGF] Saving updated UIDS", "(data too long to display ¯\\_( ͡° ͜ʖ ͡°)_/¯ )");

            String query = "UPDATE _ionickv SET `value`='" + newUIDs.toString() + "' WHERE `key`='usersInitData'";
            this.db.execSQL(query);

            callback.onEndTask();
        }
    }
}

class Tokens {
    public String access_token;
    public String refresh_token;
    public int expires_in;
    public String token_type;

    Tokens(String access_token, String refresh_token, int expires_in, String token_type) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_in = expires_in;
        this.token_type = token_type;
    }
}

class UserInitData {
    Integer id;
    Tokens tokens;
    Tokens administrationTokens;
    Institute Institute;
    String fullName;
    Boolean notificationsEnabled;
    Integer lastNotificationSetTime;
}

class Institute {
    Integer InstituteId;
    String InstituteCode;
    String Name;
    String Url;
    // City: string;
    // AdvertisingUrl: string;
    // FeatureToggleSet: {
    // JustificationFeatureEnabled: string;
    // };

    Institute(Integer InstituteId, String InstituteCode, String Name, String Url) {
        this.InstituteId = InstituteId;
        this.InstituteCode = InstituteCode;
        this.Name = Name;
        this.Url = Url;
    }
}

interface VolleyCallback {
    void onSuccess(String result);

    void onError(String result);
}

interface RenewTokenCallback {
    void onSuccess(String result);

    void onError(String result);

    void onEndTask();
}

interface NotificationCallback {
    void onFinish();
}

class EllenorzoNotificationChannel {
    public String id;
    public String name;

    EllenorzoNotificationChannel(String id, String name) {
        this.id = id;
        this.name = name;
    }
}