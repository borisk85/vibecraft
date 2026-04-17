/*
  Вставляет блок <script type="application/ld+json"> со сериализованными
  данными Schema.org. JSON.stringify без форматирования — так меньше
  весит в HTML и проще парсится валидаторами.
*/
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
