import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5002;

app.listen(PORT, () => {
  console.log(`[webhook-server-1] listening on port ${PORT}`);
});
