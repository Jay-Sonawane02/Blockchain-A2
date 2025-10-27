import json
import numpy as np
import matplotlib.pyplot as plt

# Load data
with open("metrics.json", "r") as f:
    data = json.load(f)

# Convert lists of strings to float arrays safely
def to_float_array(lst):
    arr = []
    for x in lst:
        try:
            val = float(x)
        except ValueError:
            val = np.nan  # handle "NaN" or invalid entries
        arr.append(val)
    return np.array(arr)

# Convert all metrics
metrics = {key: to_float_array(value) for key, value in data.items()}

# Create figure
plt.figure(figsize=(12, 6))

# Plot each metric (skip if all zero/NaN)
for key, arr in metrics.items():
    if np.nanmax(arr) > 0:
        plt.plot(arr, label=key)

plt.xlabel("Time / Iteration")
plt.ylabel("Value")
plt.title("Metrics Visualization from testing.js")
plt.legend()
plt.grid(True)
plt.yscale("log")  # because values differ by many orders of magnitude
plt.tight_layout()
plt.savefig("metrics_plot.png")
plt.show()
plt.close()