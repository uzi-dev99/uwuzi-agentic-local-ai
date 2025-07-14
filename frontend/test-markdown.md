# Prueba de Renderizado Markdown Mejorado

Este es un documento de prueba para verificar todas las mejoras implementadas en el sistema de renderizado de Markdown.

## Bloques de Código

### JavaScript
```javascript
function calculateFibonacci(n) {
  if (n <= 1) return n;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
}

// Ejemplo de uso con una línea muy larga que debería activar el scroll horizontal
console.log('Este es un ejemplo de una línea de código extremadamente larga que debería activar el scroll horizontal para evitar desbordamientos en el layout');
```

### Python
```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

## Tablas Responsivas

### Tabla Simple
| Nombre | Edad | Ciudad | Profesión |
|--------|------|--------|-----------|
| Ana | 28 | Madrid | Desarrolladora |
| Carlos | 35 | Barcelona | Diseñador |
| María | 42 | Valencia | Project Manager |

### Tabla Ancha (para probar scroll horizontal)
| ID | Nombre Completo | Email | Teléfono | Dirección | Ciudad | Código Postal | País | Departamento | Salario | Fecha Contratación | Estado |
|----|-----------------|-------|----------|-----------|--------|---------------|------|--------------|---------|-------------------|--------|
| 001 | Ana García López | ana.garcia@email.com | +34 600 123 456 | Calle Mayor 123, 4º B | Madrid | 28001 | España | Desarrollo | €45,000 | 2023-01-15 | Activo |
| 002 | Carlos Rodríguez Martín | carlos.rodriguez@email.com | +34 600 789 012 | Avenida Diagonal 456, 2º A | Barcelona | 08001 | España | Diseño | €42,000 | 2023-03-20 | Activo |
| 003 | María Fernández Sánchez | maria.fernandez@email.com | +34 600 345 678 | Plaza del Ayuntamiento 789 | Valencia | 46001 | España | Gestión | €50,000 | 2022-11-10 | Activo |

## Elementos de Texto

### Listas

#### Lista no ordenada
- Elemento 1
- Elemento 2 con **texto en negrita**
- Elemento 3 con *texto en cursiva*
- Elemento 4 con `código inline`

#### Lista ordenada
1. Primer paso
2. Segundo paso con [enlace](https://example.com)
3. Tercer paso
4. Cuarto paso

### Citas

> Esta es una cita de ejemplo que demuestra cómo se renderizan las citas en el nuevo sistema de Markdown.
> 
> Puede tener múltiples párrafos y mantener el formato correctamente.

### Código Inline

Puedes usar `console.log()` para imprimir en JavaScript, o `print()` en Python.

### Enlaces y Formato

Este es un [enlace a Google](https://google.com) y este texto tiene **negrita**, *cursiva*, y ***ambos***.

## Casos Extremos

### Código con caracteres especiales
```bash
echo "Hola mundo" | grep -E '^[A-Z][a-z]+' | sed 's/mundo/universo/g'
find /path/to/directory -name "*.txt" -exec rm {} \;
```

### Texto con caracteres Unicode

🚀 Emojis y caracteres especiales: α, β, γ, δ, ε, ζ, η, θ, ι, κ, λ, μ, ν, ξ, ο, π, ρ, σ, τ, υ, φ, χ, ψ, ω

### Línea muy larga sin espacios

EsteEsUnEjemploDeUnaLineaMuyLargaSinEspaciosQueDeberiaActivarElScrollHorizontalParaEvitarQueSeRompaElLayoutDeLaAplicacion

---

**Fin del documento de prueba**