# Curse API Proxy

API trung gian để lấy dữ liệu highscores từ [curseofaros.com](https://www.curseofaros.com).

## Deploy trên Vercel
1. Fork hoặc clone repo này về GitHub.
2. Vào [Vercel Dashboard](https://vercel.com/dashboard) → New Project.
3. Chọn repo `curse-api`.
4. Deploy (mất 1 phút).
5. API endpoint sẽ có dạng:

```
https://tên-dự-án.vercel.app/api/xp
```

## Cách dùng
Trong website của bạn (GitHub Pages), chỉ cần gọi:

```js
fetch("https://tên-dự-án.vercel.app/api/xp")
```
