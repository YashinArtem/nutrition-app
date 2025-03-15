export class NutritionFacts {
  public static parseGrams(value: any) {
    if (typeof value !== 'string') return value;
    let numericValue = parseFloat(value);
    if (isNaN(numericValue)) return value;
    const lowerVal = value.toLowerCase();
    if (lowerVal.includes('mg')) {
      numericValue /= 1000;
    } else if (lowerVal.includes('mcg')) {
      numericValue /= 1_000_000;
    }
    return numericValue;
  }

  public static toGrams(value: any, key: string) {
    if (typeof value !== 'number') return value;
    if (key === 'calories') return (~~value) + 'kcal';
    if (value === 0) return '0';
    let metric = 'g';
    if (value < 0.001) {
      metric = 'mcg';
      value *= 1_000_000;
    }
    else if (value < 1) {
      metric = 'mg';
      value *= 1_000;
    }
    if (value < 10) {
      value = Math.round(value * 10) / 10;
    }
    else {
      value = Math.round(value);
    }
    return `${value}${metric}`;
  }

  public static getNutritionValues(jsonString: string) {
    jsonString = jsonString.replace('```json\n', '');
    jsonString = jsonString.replace('\n```', '');
    console.log(jsonString);
    const json = JSON.parse(jsonString);
    for (const key of Object.keys(json)) {
      json[key] = this.parseGrams(json[key]);
    }
    if (json.serving_size === undefined) return json;
    for (const key of Object.keys(json)) {
      if (typeof json[key] !== 'number') continue;
      if (key === 'serving_size') continue;
      json[key] = json[key] * (100 / json.serving_size);
    }
    json.serving_size = 100;
    return json;
  }

  public static print(json: any) {
    let result = <></>;
    for (const key of Object.keys(json)) {
      if (key === 'serving_size') continue;
      let keyString = key.replace(/_/g, ' ');
      let nameClass = 'value-name value-small';
      let valueClass = 'value-value value-small';
      let lineClass = 'line-thin';
      if (key === 'calories') {
        nameClass = 'value-name value-big';
        valueClass = 'value-value value-big';
        lineClass = 'line-medium';
      }
      else if (key === 'total_fat' || key === 'total_carbohydrate' || key === 'protein') {
        nameClass = 'value-name value-medium';
        valueClass = 'value-value value-medium';
      }
      const value = this.toGrams(json[key], key);
      result = <>
        {result}
        <span class={nameClass}>{keyString}</span>: <span class={valueClass}>{value}</span>
        <hr class={lineClass} />
      </>;
    }
    return result;
  }

  public static compareNutritionValues(first: any, second: any) {
    let result = '';
    for (const key of Object.keys(first)) {
      if (key === 'serving_size') continue;
      if (second[key] === undefined) continue;
      let gramsFirst = this.toGrams(first[key], key);
      let gramsSecond = this.toGrams(second[key], key);
      if (first[key] < second[key]) {
        gramsSecond = `__${gramsSecond}__`;
      }
      else {
        gramsFirst = `__${gramsFirst}__`;
      }
      const keyString = key.replace(/_/g, ' ');
      result += `*${keyString}*:\t\t ${gramsFirst} vs ${gramsSecond}\n`;
    }
    result = `Nutrition facts per 100g:\n\n${result}`;
    return result;
  }
}