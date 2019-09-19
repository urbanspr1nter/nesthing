# The Overflow Flag

|Instruction|Operand A|Operand B|Final|
|-----------|---------|---------|-----|
|ADC|Positive|Positive|Negative|
|ADC|Negative|Negative|Positive|
|SBC|Positive|Negative|Negative|
|SBC|Negative|Positive|Positive|

## ADC Logic

```js
    const modifiedFirst = first & 0xff;
    const modifiedSecond = second & 0xff;
    const modifiedFinal = final & 0xff;

    const adcA =
        (modifiedFirst & 0x80) === 0 &&
        (modifiedSecond & 0x80) === 0 &&
        (modifiedFirst & 0x80) === 0 &&
        (modifiedFinal & 0x80) !== 0 &&
        (modifiedSecond & 0x80) === 0 &&
        (modifiedFinal & 0x80) !== 0;

    const adcB =
        (modifiedFirst & 0x80) !== 0 &&
        (modifiedSecond & 0x80) !== 0 &&
        (modifiedFirst & 0x80) !== 0 &&
        (modifiedFinal & 0x80) === 0 &&
        (modifiedSecond & 0x80) !== 0 &&
        (modifiedFinal & 0x80) === 0;

    if (adcA || adcB) {
        return true;
    }

    return false;
```

We can simplify this logic to:

```js
    const adcA = 
        ((modifiedFirst ^ modifiedSecond) & 0x80) === 0 &&
        ((modifiedFirst ^ modifiedFinal) & 0x80) !== 0 && 
        ((modifiedSecond ^ modifiedFinal) & 0x80) !== 0;
```

```js
    const adcA = 
        ((modifiedFirst ^ modifiedSecond) & 0x80) === 0 &&
        ((modifiedFinal ^ (modifiedFirst ^ modifiedSecond)) & 0x80) !== 0;
```

```js
    const adcA = 
        ((modifiedFirst ^ modifiedSecond) & 0x80) === 0 && // has to be the same sign!
        ((modifiedFinal ^ modifiedFirst) & 0x80) !== 0;
```

```js
    const adcB =
        (modifiedFirst & 0x80) !== 0 && // negative
        (modifiedSecond & 0x80) !== 0 && // negative
        (modifiedFirst & 0x80) !== 0 &&
        (modifiedFinal & 0x80) === 0 && // positive
        (modifiedSecond & 0x80) !== 0 &&
        (modifiedFinal & 0x80) === 0; // positive
```

```js
    const adcB =
        (modifiedFirst ^ modifiedSecond) & 0x80 === 0 &&
        ((modifiedFinal ^ (modifiedFirst ^ modifiedSecond)) & 0x80) !== 0; 
```

```js
    const adcB = 
        (modifiedFirst ^ modifiedSecond) & 0x80 === 0 &&
        ((modifiedFinal ^ modifiedFirst) & 0x80) !== 0;
```

## SBC Logic

```js
    const sbcA =
        (modifiedFirst & 0x80) === 0 &&
        (modifiedSecond & 0x80) !== 0 &&
        (modifiedFinal & 0x80) !== 0;
    const sbcB =
        (modifiedFirst & 0x80) !== 0 &&
        (modifiedSecond & 0x80) === 0 &&
        (modifiedFinal & 0x80) === 0;

    if (sbcA || sbcB) {
      return true;
    }

    return false;
```