import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Извлекает eventId из содержимого QR-кода.
 * Поддерживаемые форматы:
 *   "event_123"
 *   "123"
 *   "https://smart-assembly.org/events/123"
 *   любая строка, содержащая /events/<id> или event_<id>
 */
function parseEventIdFromQr(qrData) {
  if (!qrData) return null;
  const data = String(qrData).trim();

  const eventPrefix = data.match(/event_(\d+)/i);
  if (eventPrefix) return eventPrefix[1];

  const urlMatch = data.match(/\/events\/(\d+)/i);
  if (urlMatch) return urlMatch[1];

  if (/^\d+$/.test(data)) return data;

  return null;
}

/**
 * Сканер QR. Парсит eventId из QR и навигирует на страницу события
 * с параметром ?from_qr=true. Сам чекин делает уже EventDetailPage.
 */
export default function QrScannerModal({ onClose }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    if (!scanning) return;

    const startCamera = async () => {
      try {
        setCameraError(null);

        // Запрашиваем доступ к камере
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Задняя камера на мобильных
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // Начинаем декодирование QR
          setTimeout(() => scanQrCode(videoRef, canvasRef), 500);
        }
      } catch (err) {
        console.error('Ошибка доступа к камере:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Разреши доступ к камере в настройках телефона'
            : 'Не удалось включить камеру. Проверь, что браузер имеет доступ.'
        );
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      // Очищаем стрим при размонтировании
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning]);

  /**
   * Сканирование QR-кода из видеопотока
   * Используем встроенный QR-декодер браузера или jsQR (нужно подключить)
   */
  const scanQrCode = async (videoRef, canvasRef) => {
    if (!videoRef.current || !scanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Рисуем текущий кадр из видео на canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      // Пытаемся декодировать QR с помощью встроенного BarcodeDetector API
      if (window.BarcodeDetector) {
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code']
        });
        const barcodes = await barcodeDetector.detect(canvas);

        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          console.log('QR отсканирован:', qrData);
          handleQrScanned(qrData);
          return;
        }
      } else {
        // Fallback: используем jsQR, если BarcodeDetector недоступен
        // Убедись, что jsQR загружена в index.html:
        // <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
          const code = window.jsQR(
            imageData.data,
            imageData.width,
            imageData.height
          );

          if (code) {
            console.log('QR отсканирован (jsQR):', code.data);
            handleQrScanned(code.data);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Ошибка при декодировании QR:', err);
    }

    // Если QR не найден, продолжаем сканирование
    if (scanning) {
      requestAnimationFrame(() => scanQrCode(videoRef, canvasRef));
    }
  };

  /**
   * Обработка отсканированного QR-кода.
   * Парсим eventId и навигируем на страницу события с флагом from_qr.
   * Сам чекин происходит уже там по нажатию кнопки.
   */
  const handleQrScanned = (qrData) => {
    setScannedData(qrData);
    setScanning(false);

    const eventId = parseEventIdFromQr(qrData);
    if (!eventId) {
      setError('QR не содержит идентификатор мероприятия');
      setTimeout(() => {
        setScannedData(null);
        setScanning(true);
      }, 2000);
      return;
    }

    // Небольшая задержка, чтобы показать «✅ Отсканировано», и переходим.
    setTimeout(() => {
      onClose?.();
      navigate(`/events/${eventId}?from_qr=true`);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-card p-6 max-w-sm w-full shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">📱 Сканируй QR</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Видео поток с камеры */}
        {scanning && !error && !cameraError && (
          <div className="relative mb-4">
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black object-cover"
              style={{ aspectRatio: '1 / 1' }}
              playsInline
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />

            {/* Направляющая сетка для удобства */}
            <div className="absolute inset-0 rounded-lg border-2 border-primary/30 pointer-events-none flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-sm font-medium mb-2">Наведи на QR</p>
                <div className="w-32 h-32 border-2 border-primary/50 rounded-lg"></div>
              </div>
            </div>
          </div>
        )}

        {/* Состояние после сканирования */}
        {scannedData && !error && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm text-text-primary font-medium mb-1">
              Отметка принята!
            </p>
            <p className="text-xs text-text-muted">
              Спасибо за участие ❤️
            </p>
          </div>
        )}

        {/* Ошибка при сканировании */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 font-medium mb-2">Ошибка:</p>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setScanning(true);
              }}
              className="mt-3 w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {/* Ошибка доступа к камере */}
        {cameraError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-700 font-medium mb-2">Нет доступа к камере:</p>
            <p className="text-xs text-orange-600 mb-3">{cameraError}</p>
            <p className="text-xs text-orange-600 mb-3">
              <strong>Как исправить:</strong>
              <br />
              1. Открой настройки браузера<br />
              2. Найди разрешения для этого сайта<br />
              3. Разреши доступ к камере<br />
              4. Обнови страницу
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        )}

        {/* Справка для пользователя */}
        {scanning && !cameraError && (
          <div className="text-center text-xs text-text-muted bg-blue-50 rounded-lg p-3">
            <p>💡 Поднеси телефон к QR-коду</p>
            <p>Чекин произойдёт автоматически</p>
          </div>
        )}

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-btn transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}