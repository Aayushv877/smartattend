import { getToken } from "./auth";

const API_URL =
  "https://861othoid8.execute-api.ap-south-1.amazonaws.com/prod";

export async function getAttendanceHistory() {

  const token = await getToken();

  const res = await fetch(
    `${API_URL}/attendance/history`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await res.json();
}