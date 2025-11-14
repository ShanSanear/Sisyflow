# Markdown Syntax Guide

Supported markdown elements and how to use them.

## Headings

```
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Text Formatting

```
**bold text** or __bold text__
*italic text* or _italic text_
***bold and italic***
~~strikethrough~~
`inline code`
```

**bold text** or **bold text**

_italic text_ or _italic text_

**_bold and italic_**

~~strikethrough~~

`inline code`

Combine: ~~**strikethrough and bold**~~

## Lists

### Unordered list

```
- Item 1
- Item 2
  - Nested item
    - Deeply nested
```

- Item 1
- Item 2
  - Nested item
    - Deeply nested

### Ordered list

```
1. First item
2. Second item
3. Third item
   1. Nested numbered
```

1. First item
2. Second item
3. Third item
   1. Nested numbered

### Task list

```
- [x] Completed task
- [ ] Pending task
```

- [x] Completed task
- [ ] Pending task

## Links

```
[Link text](https://example.com)
[Internal link](#section-name)
```

[Link text](https://example.com)

[Internal link](#section-name)

or automatic:

```
<https://example.com>
<user@example.com>
```

<https://example.com>

<user@example.com>

## Code Blocks

### Fenced code block

````
```
code block
```
````

```
code block
```

### Indented (4 spaces)

```
    function example() {
      return true;
    }
```

## Blockquotes

```
> This is a quote
```

> This is a quote

Nested:

```
> > Nested quote
```

> > Nested quote

## Tables

### Basic table

```
| Header 1 | Header 2 |
|----------|----------|
| Cell 1 | Cell 2 |
```

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |

### Aligned columns

```
| Left | Center | Right |
|:-----|:------:|------:|
| Left | Center | Right |
```

| Left | Center | Right |
| :--- | :----: | ----: |
| Left | Center | Right |

## Horizontal Rule

```
---
```

---

or

```
***
```

---
